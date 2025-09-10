import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, Image, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { validatePaymentProofFile, getFileTypeIcon } from "@/lib/storage";

interface PaymentProofUploadProps {
  onFileSelect: (file: File | null) => void;
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  isUploading: boolean;
  selectedFile: File | null;
  disabled?: boolean;
}

const PaymentProofUpload = ({
  onFileSelect,
  customerName,
  onCustomerNameChange,
  isUploading,
  selectedFile,
  disabled = false
}: PaymentProofUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      onFileSelect(null);
      return;
    }

    const validation = validatePaymentProofFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    onFileSelect(file);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleFileChange(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const openFileDialog = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    if (disabled) return;
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="campus-card animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Payment Proof
        </CardTitle>
        <CardDescription>
          Upload a screenshot or PDF of your payment confirmation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Name Input */}
        <div className="space-y-2">
          <Label htmlFor="customerName">Your Name *</Label>
          <Input
            id="customerName"
            placeholder="Enter your full name"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="campus-input"
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            This name will be used for order confirmation
          </p>
        </div>

        {/* File Upload Area */}
        <div className="space-y-4">
          <Label>Payment Proof Document *</Label>
          
          {!selectedFile ? (
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleInputChange}
                disabled={disabled}
              />
              
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    Upload Payment Proof
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports: Images (PNG, JPEG, WebP) and PDF files
                    <br />
                    Maximum file size: 10MB
                  </p>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="pointer-events-none"
                  disabled={disabled}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </div>
          ) : (
            <div className="border border-muted rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {getFileTypeIcon(selectedFile.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-destructive hover:text-destructive"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Upload Instructions */}
        <div className="bg-accent-light/20 border border-accent/20 rounded-lg p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Upload Guidelines
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
            <li>Upload a clear screenshot of your mobile money payment confirmation</li>
            <li>Ensure transaction details are visible and readable</li>
            <li>PDF receipts are also accepted</li>
            <li>File must be less than 10MB in size</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentProofUpload;
