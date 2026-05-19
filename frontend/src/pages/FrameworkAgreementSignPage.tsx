import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Download, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createApiUrl } from '@/config/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface SignerLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface FrameworkAgreementResponse {
  agreement: {
    agreementId: string;
    status: 'sent' | 'delivered' | 'opened' | 'acknowledged';
    acknowledgedAt?: string;
    updatedAt?: string;
    buyerName?: string;
    sellerName?: string;
    sellerEmail?: string;
    recipientEmail?: string;
    agreementData?: {
      buyer?: { name?: string; address?: string };
      seller?: { name?: string; address?: string };
      agreementDate?: string;
      place?: string;
    };
  };
  canSign: boolean;
}

interface SignatureCanvasRef {
  toDataURL: () => string;
  clear: () => void;
}

const SignatureCanvas = React.forwardRef<SignatureCanvasRef>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  React.useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current?.toDataURL() || '',
    clear: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }));

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
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={420}
      height={150}
      className="border border-gray-300 cursor-crosshair bg-white"
      onMouseDown={(e) => {
        setIsDrawing(true);
        draw(e);
      }}
      onMouseMove={draw}
      onMouseUp={() => setIsDrawing(false)}
      onMouseLeave={() => setIsDrawing(false)}
      style={{ touchAction: 'none' }}
    />
  );
});

SignatureCanvas.displayName = 'SignatureCanvas';

export default function FrameworkAgreementSignPage() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [signed, setSigned] = useState(false);
  const [signedTimestamp, setSignedTimestamp] = useState('');
  const [data, setData] = useState<FrameworkAgreementResponse | null>(null);

  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [location, setLocation] = useState<SignerLocation | null>(null);
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [startingCamera, setStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const signatureRef = useRef<SignatureCanvasRef>(null);

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
    } catch (_error) {
      setCameraError('Camera permission denied or camera unavailable');
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
    setPhotoDataUrl(canvas.toDataURL('image/png'));
    toast.success('Selfie captured successfully');
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const locationData = await response.json();
    const address = locationData?.address || {};
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
      async (positionValue) => {
        try {
          const latitude = positionValue.coords.latitude;
          const longitude = positionValue.coords.longitude;
          const resolved = await reverseGeocode(latitude, longitude);

          setLocation({
            city: resolved.city,
            country: resolved.country,
            latitude,
            longitude,
            accuracy: positionValue.coords.accuracy
          });
        } catch (geoError) {
          toast.error(geoError instanceof Error ? geoError.message : 'Unable to resolve city/country');
          setLocation(null);
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

  const loadAgreement = async () => {
    if (!token) {
      setError('Invalid framework agreement token');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(createApiUrl(`/documents/framework-agreement/${token}`));
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load framework agreement');
      }

      setData(result.data);
      if (result.data?.agreement?.status === 'acknowledged') {
        setSigned(true);
        setSignedTimestamp(result.data?.agreement?.acknowledgedAt || result.data?.agreement?.updatedAt || '');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load framework agreement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgreement();
  }, [token]);

  useEffect(() => {
    captureLocation();
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const handleSign = async () => {
    if (!token) return;

    if (!fullName.trim() || !position.trim()) {
      toast.error('Please fill in full name and position');
      return;
    }

    const signatureDataUrl = signatureRef.current?.toDataURL();
    if (!signatureDataUrl || signatureDataUrl === 'data:,') {
      toast.error('Please provide your signature');
      return;
    }

    if (!location) {
      toast.error('Please capture your current location');
      return;
    }

    if (!photoDataUrl) {
      toast.error('Please capture your live selfie');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(createApiUrl(`/documents/framework-agreement/${token}/sign`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName,
          position,
          signatureDataUrl,
          photoDataUrl,
          location
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to sign framework agreement');
      }

      setSigned(true);
      setSignedTimestamp(result?.data?.acknowledgedAt || new Date().toISOString());
      toast.success('Framework agreement signed successfully');
      loadAgreement();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Failed to sign framework agreement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!token) return;

    try {
      const response = await fetch(createApiUrl(`/documents/framework-agreement/${token}/pdf`));
      if (!response.ok) {
        throw new Error('Failed to download signed agreement PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = `FrameworkAgreement-${token}-signed.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (_error) {
      toast.error('Failed to download signed PDF');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading framework agreement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Error</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const agreement = data?.agreement;
  const payload = agreement?.agreementData || {};

  if (signed) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Framework Agreement Signed</h1>
              <p className="text-lg text-gray-700 mb-6">
                Thank you. The framework agreement was successfully executed on {formatDate(signedTimestamp)}.
              </p>
              <Button onClick={handleDownloadPdf} className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Download Signed PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Framework Agreement Signature</h1>
        <p className="text-muted-foreground">
          Review the details and complete digital signing to acknowledge this agreement.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 space-y-2">
              <h2 className="font-semibold">Agreement Details</h2>
              <p><strong>Agreement ID:</strong> {agreement?.agreementId}</p>
              <p><strong>Buyer:</strong> {agreement?.buyerName || payload?.buyer?.name || '-'}</p>
              <p><strong>Seller:</strong> {agreement?.sellerName || payload?.seller?.name || '-'}</p>
              <p><strong>Agreement Date:</strong> {payload?.agreementDate || '-'}</p>
              <p><strong>Place:</strong> {payload?.place || '-'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <h2 className="font-semibold">Party Addresses</h2>
              <p><strong>Buyer Address:</strong> {payload?.buyer?.address || '-'}</p>
              <p><strong>Seller Address:</strong> {payload?.seller?.address || '-'}</p>
              <p><strong>Signer Email:</strong> {agreement?.recipientEmail || '-'}</p>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <AlertDescription>
            By signing, you confirm that you are authorized to execute this framework agreement on behalf of the seller.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="position">Position</Label>
              <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>

            <div>
              <Label>Digital Signature</Label>
              <div className="mt-2 border-2 border-gray-300 bg-white max-w-[430px]">
                <SignatureCanvas ref={signatureRef} />
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => signatureRef.current?.clear()}>
                Clear Signature
              </Button>
            </div>

            <div className="space-y-3 p-3 border rounded-md bg-gray-50 max-w-md">
              <Label>Live Selfie</Label>
              <video ref={videoRef} className="w-full rounded-md border bg-black" autoPlay playsInline muted />
              <canvas ref={captureCanvasRef} className="hidden" />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={startCamera} disabled={startingCamera}>
                  {startingCamera ? 'Opening Camera...' : 'Enable Camera'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={captureSelfie}>
                  Click Selfie
                </Button>
              </div>
              {cameraError && <p className="text-sm text-red-600">{cameraError}</p>}
              {photoDataUrl && (
                <img src={photoDataUrl} alt="Captured selfie" className="w-28 h-28 rounded-md object-cover border" />
              )}
            </div>

            <div className="space-y-3 p-3 border rounded-md bg-gray-50 max-w-md">
              <div className="flex items-center justify-between">
                <Label>Current Location</Label>
                <Button type="button" variant="outline" size="sm" onClick={captureLocation} disabled={capturingLocation}>
                  {capturingLocation ? 'Capturing...' : 'Refresh Location'}
                </Button>
              </div>
              {location ? (
                <p className="text-sm text-gray-700">{location.city}, {location.country}</p>
              ) : (
                <p className="text-sm text-red-600">City and country not captured yet.</p>
              )}
            </div>

            <Button onClick={handleSign} disabled={submitting} className="w-full bg-green-600 hover:bg-green-700">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                'Sign and Confirm'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
