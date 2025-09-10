import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, ExternalLink, FileText, Image } from "lucide-react";
import { getFileTypeIcon } from "@/lib/storage";

interface PaymentProofViewerProps {
  paymentProofUrl?: string | null;
  customerName?: string;
  orderId: string;
  trigger?: React.ReactNode;
}

const PaymentProofViewer = ({ 
  paymentProofUrl, 
  customerName, 
  orderId,
  trigger 
}: PaymentProofViewerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!paymentProofUrl) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <FileText className="h-4 w-4" />
        No payment proof
      </div>
    );
  }

  const fileName = paymentProofUrl.split('/').pop() || 'payment-proof';
  const isImage = paymentProofUrl.match(/\.(jpg|jpeg|png|webp)$/i);
  const isPdf = paymentProofUrl.match(/\.pdf$/i);

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="h-auto p-1">
      <Eye className="h-4 w-4" />
    </Button>
  );

  const handleOpenExternal = () => {
    window.open(paymentProofUrl, '_blank');
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{getFileTypeIcon(fileName)}</span>
            Payment Proof - Order #{orderId.slice(0, 8)}
          </DialogTitle>
          {customerName && (
            <p className="text-sm text-muted-foreground">
              Customer: {customerName}
            </p>
          )}
        </DialogHeader>
        
        <div className="flex flex-col gap-4 max-h-[calc(90vh-120px)]">
          {/* File Actions */}
          <div className="flex items-center gap-2 border-b pb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExternal}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
            <span className="text-sm text-muted-foreground">
              File: {fileName}
            </span>
          </div>
          
          {/* File Content */}
          <div className="flex-1 overflow-auto">
            {isImage ? (
              <div className="flex justify-center">
                <img
                  src={paymentProofUrl}
                  alt="Payment Proof"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-muted rounded-lg">
                          <div class="text-4xl">🖼️</div>
                          <div class="text-center">
                            <p class="font-medium">Unable to load image</p>
                            <p class="text-sm text-muted-foreground">Click "Open in New Tab" to view the file</p>
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
            ) : isPdf ? (
              <div className="w-full h-[60vh] border rounded-lg">
                <iframe
                  src={paymentProofUrl}
                  className="w-full h-full rounded-lg"
                  title="Payment Proof PDF"
                  onError={() => {
                    console.log("PDF iframe failed to load");
                  }}
                >
                  <div className="flex flex-col items-center gap-4 p-8">
                    <div className="text-4xl">📄</div>
                    <div className="text-center">
                      <p className="font-medium">Unable to display PDF</p>
                      <p className="text-sm text-muted-foreground">
                        Click "Open in New Tab" to view the PDF file
                      </p>
                    </div>
                  </div>
                </iframe>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-muted rounded-lg">
                <div className="text-4xl">{getFileTypeIcon(fileName)}</div>
                <div className="text-center">
                  <p className="font-medium">File Preview Not Available</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Open in New Tab" to view the file
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentProofViewer;
