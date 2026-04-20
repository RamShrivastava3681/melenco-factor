import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { createApiUrl } from '@/config/api';
import { formatDate } from '@/lib/utils';

interface BuyerLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface NOAData {
  noaData: {
    id: string;
    transactionId: string;
    token: string;
    buyerEmail: string;
    expiresAt: string;
    status: 'pending' | 'viewed' | 'signed';
    createdAt: string;
    viewedAt?: string;
    signedAt?: string;
    signatoryData?: {
      fullName: string;
      position: string;
      ipAddress: string;
      userAgent: string;
      signatureDataUrl?: string;
    };
    invoiceData: any;
  };
  transaction: any;
  partyDetails?: {
    buyer?: {
      name?: string;
      addressLines?: string[];
      email?: string;
    };
    supplier?: {
      name?: string;
      addressLines?: string[];
      email?: string;
      phone?: string;
    };
    support?: {
      email?: string;
      phone?: string;
    };
  };
  canSign: boolean;
}

interface SignatureCanvasRef {
  toDataURL: () => string;
  clear: () => void;
}

const SignatureCanvas = React.forwardRef<SignatureCanvasRef, any>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  React.useImperativeHandle(ref, () => ({
    toDataURL: () => {
      return canvasRef.current?.toDataURL() || '';
    },
    clear: () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
  }));

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={150}
      className="border border-gray-300 cursor-crosshair bg-white"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      style={{ touchAction: 'none' }}
    />
  );
});

SignatureCanvas.displayName = 'SignatureCanvas';

export function NOAPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [noaData, setNoaData] = useState<NOAData | null>(null);
  const [error, setError] = useState<string>('');
  
  // Signature form data
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [buyerLocation, setBuyerLocation] = useState<BuyerLocation | null>(null);
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [startingCamera, setStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const signatureRef = useRef<SignatureCanvasRef>(null);
  
  // Success state
  const [signed, setSigned] = useState(false);
  const [signedTimestamp, setSignedTimestamp] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setError('Invalid NOA token');
      setLoading(false);
      return;
    }

    loadNOAData();
  }, [token]);

  useEffect(() => {
    if (navigator.geolocation) {
      captureLocation();
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      setStartingCamera(true);
      setCameraError('');

      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setCameraError('Camera permission denied or camera not available');
      toast.error('Please allow camera access to capture a live selfie');
    } finally {
      setStartingCamera(false);
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;

    if (!video || !canvas) {
      toast.error('Camera is not ready yet');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast.error('Unable to capture selfie');
      return;
    }

    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 360;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/png');
    setPhotoDataUrl(imageDataUrl);
    toast.success('Selfie captured successfully');
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    const address = data?.address || {};
    const city = address.city || address.town || address.village || address.state_district || address.county;
    const country = address.country;

    if (!city || !country) {
      throw new Error('City/Country not found for your location');
    }

    return { city, country };
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser');
      return;
    }

    setCapturingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const resolvedLocation = await reverseGeocode(latitude, longitude);

          setBuyerLocation({
            city: resolvedLocation.city,
            country: resolvedLocation.country,
            latitude,
            longitude,
            accuracy: position.coords.accuracy
          });
        } catch (locationError) {
          toast.error(locationError instanceof Error ? locationError.message : 'Unable to resolve city/country from location');
          setBuyerLocation(null);
        } finally {
          setCapturingLocation(false);
        }
      },
      (geoError) => {
        setCapturingLocation(false);
        toast.error(`Unable to capture location: ${geoError.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const loadNOAData = async () => {
    try {
      setLoading(true);
      const response = await fetch(createApiUrl(`/noa/${token}`));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load NOA data');
      }

      setNoaData(data.data);
      
      if (data.data.noaData.status === 'signed') {
        setSigned(true);
        setSignedTimestamp(data.data.noaData.signedAt);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load NOA');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!fullName.trim() || !position.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const signatureDataUrl = signatureRef.current?.toDataURL();
    if (!signatureDataUrl || signatureDataUrl === 'data:,') {
      toast.error('Please provide your signature');
      return;
    }

    if (!buyerLocation) {
      toast.error('Please allow and capture your current location');
      return;
    }

    if (!photoDataUrl) {
      toast.error('Please capture your live selfie');
      return;
    }

    if (!buyerLocation.city || !buyerLocation.country) {
      toast.error('Please allow location access to capture your city and country');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch(createApiUrl(`/noa/${token}/sign`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName,
          position,
          signatureDataUrl,
          location: buyerLocation,
          photoDataUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign NOA');
      }

      setSigned(true);
      setSignedTimestamp(data.data.signedAt);
      toast.success('NOA signed successfully');
      
      // Reload the data to update status
      loadNOAData();

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sign NOA');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(createApiUrl(`/noa/${token}/pdf`));
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `NOA-${noaData?.transaction.transactionId}-signed.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      toast.error('Failed to download PDF');
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading NOA document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!noaData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>NOA data not found</p>
      </div>
    );
  }

  const referenceNumber = `REF-${noaData.transaction.transactionId}-${Date.now().toString().slice(-6)}`;
  const expiresDate = new Date(noaData.noaData.expiresAt);

  if (signed) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Confirmation of Invoice Verification
              </h1>
              <p className="text-lg text-gray-700 mb-6">
                Thank you. The Invoice Verification Letter has been successfully executed on{' '}
                {formatDate(signedTimestamp)} at{' '}
                {new Date(signedTimestamp).toLocaleTimeString()}.
              </p>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Download Signed PDF
                </Button>
              </div>
              
              <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                <p><strong>Support Contact:</strong></p>
                <p>Email: {noaData.partyDetails?.support?.email || 'admin@whizunik.com'}</p>
                <p>Phone: {noaData.partyDetails?.support?.phone || '+91-9958880183'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print-friendly styles */}
      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          .page-content { margin: 0; padding: 0; }
        }
      `}</style>
      
      <div className="max-w-4xl mx-auto p-8 page-content">
        {/* Expiry Warning */}
        {new Date() > new Date(Date.now() + 24 * 60 * 60 * 1000) && (
          <Alert className="mb-6 border-orange-200 bg-orange-50 no-print">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              This NOA will expire on {expiresDate.toLocaleDateString()} at {expiresDate.toLocaleTimeString()}.
              Please sign before the expiry date.
            </AlertDescription>
          </Alert>
        )}

        {/* Header Section */}
        <div className="flex justify-between border-b-2 border-gray-900 pb-6 mb-8">
          <div>
            <h3 className="font-semibold text-lg">{noaData.transaction.buyerName}</h3>
            <div className="mt-2 text-gray-700 leading-relaxed">
              {(noaData.partyDetails?.buyer?.addressLines?.length
                ? noaData.partyDetails.buyer.addressLines
                : ['Address not available'])
                .map((line, index) => (
                  <div key={`buyer-address-${index}`}>{line}</div>
                ))}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">Your Supplier:</div>
            <div className="font-semibold text-lg">{noaData.transaction.supplierName}</div>
            <div className="mt-2 text-gray-700 leading-relaxed">
              {(noaData.partyDetails?.supplier?.addressLines?.length
                ? noaData.partyDetails.supplier.addressLines
                : ['Address not available'])
                .map((line, index) => (
                  <div key={`supplier-address-${index}`}>{line}</div>
                ))}
            </div>
          </div>
        </div>

        {/* Document Details */}
        <div className="mb-8 space-y-2">
          <p><span className="font-semibold">Date:</span> {formatDate(new Date())}</p>
          <p><span className="font-semibold">Our Reference:</span> {referenceNumber}</p>
          <p><span className="font-semibold">Invoice Verification Letter No.:</span> IVL-{noaData.transaction.transactionId}</p>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center uppercase mb-8 tracking-wide">
          Invoice Verification Letter
        </h1>

        {/* Opening Paragraph */}
        <p className="mb-6 text-justify leading-relaxed">
          We are writing to inform you that we have entered into a receivables financing agreement 
          with the above-named supplier and have purchased the receivables relating to the invoice(s) 
          detailed below.
        </p>

        {/* Invoice Details Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-900">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-900 p-3 text-left font-semibold">Invoice Number</th>
                <th className="border border-gray-900 p-3 text-left font-semibold">Issue Date</th>
                <th className="border border-gray-900 p-3 text-left font-semibold">Due Date</th>
                <th className="border border-gray-900 p-3 text-left font-semibold">Invoice Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-900 p-3">{noaData.transaction.invoiceNumber}</td>
                <td className="border border-gray-900 p-3">{formatDate(noaData.transaction.invoiceDate)}</td>
                <td className="border border-gray-900 p-3">{formatDate(noaData.transaction.dueDate)}</td>
                <td className="border border-gray-900 p-3">
                  {noaData.transaction.currency} {parseFloat(noaData.transaction.invoiceAmount).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legal Confirmation Section */}
        <div className="mb-8">
          <p className="mb-4 text-justify leading-relaxed">
            By signing this letter, you confirm that:
          </p>
          <ol className="list-decimal list-inside space-y-3 text-justify leading-relaxed">
            <li>You acknowledge our notification of the purchase of the above receivables;</li>
            <li>The goods and/or services represented by the invoice have been delivered and conform to your requirements;</li>
            <li>There is no consignment, retention of title, or similar arrangement affecting these goods;</li>
            <li>You will pay the invoice amount in full without any deduction, set-off, or counterclaim;</li>
            <li>Payment will be made directly to the designated account communicated by us;</li>
            <li>You confirm compliance with all applicable anti-bribery and corruption laws.</li>
          </ol>
        </div>

        {/* Legal Jurisdiction */}
        <p className="mb-8 text-justify leading-relaxed text-sm">
          This agreement shall be governed by English law and subject to the exclusive jurisdiction 
          of the English courts. Any disputes arising may be referred to arbitration under the LCIA Rules, 
          conducted in London in the English language.
        </p>

        {/* Signature Section */}
        <div className="flex justify-between gap-12 mb-8">
          {/* Left side - Whizunik signature */}
          <div className="w-1/2">
            <p className="font-semibold mb-4">Yours faithfully,</p>
            <div className="border border-gray-300 h-24 mb-4 bg-gray-50"></div>
            <p className="text-sm">
              <strong>Whizunik Finance Team</strong><br />
              Authorized Signatory
            </p>
          </div>

          {/* Right side - Buyer signature */}
          <div className="w-1/2">
            <p className="font-semibold mb-4">Acknowledged and agreed:</p>
            
            {noaData.canSign ? (
              <div className="space-y-4 no-print">
                <div>
                  <Label htmlFor="signature">Digital Signature *</Label>
                  <div className="mt-2 border-2 border-gray-300 bg-white">
                    <SignatureCanvas ref={signatureRef} />
                  </div>
                  <Button 
                    onClick={clearSignature} 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                  >
                    Clear Signature
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position *</Label>
                    <Input
                      id="position"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="Enter your position"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-3 p-3 border rounded-md bg-gray-50">
                  <Label>Live Buyer Selfie *</Label>
                  <video
                    ref={videoRef}
                    className="w-full max-w-xs rounded-md border bg-black"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas ref={captureCanvasRef} className="hidden" />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={startCamera}
                      disabled={startingCamera}
                    >
                      {startingCamera ? 'Opening Camera...' : 'Enable Camera'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={captureSelfie}
                    >
                      Click Selfie
                    </Button>
                  </div>
                  {cameraError && <p className="text-sm text-red-600">{cameraError}</p>}
                  {photoDataUrl && (
                    <img
                      src={photoDataUrl}
                      alt="Captured buyer selfie preview"
                      className="w-28 h-28 rounded-md object-cover border"
                    />
                  )}
                </div>

                <div className="space-y-3 p-3 border rounded-md bg-gray-50">
                  <div className="flex items-center justify-between">
                    <Label>Current Location *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={captureLocation}
                      disabled={capturingLocation}
                    >
                      {capturingLocation ? 'Capturing...' : 'Refresh Location'}
                    </Button>
                  </div>
                  {buyerLocation ? (
                    <p className="text-sm text-gray-700">
                      {buyerLocation.city}, {buyerLocation.country}
                    </p>
                  ) : (
                    <p className="text-sm text-red-600">City and country not captured yet.</p>
                  )}
                </div>

                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {formatDate(new Date())}
                </p>

                <Button
                  onClick={handleSign}
                  disabled={submitting}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing...
                    </>
                  ) : (
                    'Sign & Confirm'
                  )}
                </Button>
              </div>
            ) : (
              <div className="border border-gray-300 h-24 bg-gray-50 flex items-center justify-center">
                <span className="text-gray-500">Document already signed</span>
              </div>
            )}
          </div>
        </div>

        {/* Print Button */}
        <div className="text-center no-print">
          <Button onClick={() => window.print()} variant="outline">
            Print Document
          </Button>
          <p className="mt-4 text-sm text-gray-600">
            Contact: {noaData.partyDetails?.support?.email || 'admin@whizunik.com'} | {noaData.partyDetails?.support?.phone || '+91-9958880183'}
          </p>
        </div>
      </div>
    </div>
  );
}