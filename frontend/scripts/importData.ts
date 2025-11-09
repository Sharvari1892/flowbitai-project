import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

interface RawDocument {
  _id: string;
  name: string;
  filePath: string;
  fileSize: { $numberLong: string };
  fileType: string;
  status: string;
  organizationId: string;
  departmentId: string;
  createdAt: { $date: string };
  updatedAt: { $date: string };
  processedAt?: { $date: string };
  analyticsId?: string;
  extractedData?: {
    llmData?: {
      invoice?: {
        value?: {
          invoiceId?: { value?: string; confidence?: string };
          invoiceDate?: { value?: string; confidence?: string };
          deliveryDate?: { value?: string; confidence?: string };
        };
      };
      vendor?: {
        value?: {
          vendorName?: { value?: string; confidence?: string };
          vendorAddress?: { value?: string; confidence?: string };
          vendorTaxId?: { value?: string; confidence?: string };
        };
      };
      customer?: {
        value?: {
          customerName?: { value?: string; confidence?: string };
          customerAddress?: { value?: string; confidence?: string };
          customerTaxId?: { value?: string; confidence?: string };
        };
      };
      payment?: {
        value?: {
          dueDate?: { value?: string; confidence?: string };
          paymentTerms?: { value?: string; confidence?: string };
          bankAccountNumber?: { value?: string; confidence?: string };
          netDays?: number;
          discountPercentage?: number;
        };
      };
      summary?: {
        value?: {
          subTotal?: { value?: number; confidence?: string };
          totalTax?: { value?: number; confidence?: string };
          invoiceTotal?: { value?: number; confidence?: string };
          documentType?: string;
          currencySymbol?: string;
        };
      };
      lineItems?: {
        value?: {
          items?: {
            value?: Array<{
              srNo?: { value?: number };
              description?: { value?: string; confidence?: string };
              quantity?: { value?: number };
              unitPrice?: { value?: number };
              amount?: { value?: number };
              vatRate?: { value?: number };
              vatAmount?: { value?: number };
            }>;
          };
        };
      };
    };
  };
}

async function importData() {
  try {
    // Read the JSON file (go up two levels: scripts -> frontend -> project root)
    const filePath = path.join(__dirname, '..', '..', 'Analytics_Test_Data.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const documents: RawDocument[] = JSON.parse(rawData);

    console.log(`Found ${documents.length} documents to import...`);

    let imported = 0;
    let skipped = 0;

    for (const doc of documents) {
      try {
        // Check if document already exists
        const exists = await prisma.document.findUnique({
          where: { id: doc._id }
        });

        if (exists) {
          console.log(`Skipping document ${doc._id} - already exists`);
          skipped++;
          continue;
        }

        // Parse confidence values
        const parseConfidence = (conf?: string): number | null => {
          if (!conf) return null;
          const parsed = parseFloat(conf);
          return isNaN(parsed) ? null : parsed;
        };

        // Helper to extract value from nested objects or return the value itself
        const extractValue = (field: any): any => {
          if (field === null || field === undefined) return null;
          if (typeof field === 'object' && 'value' in field) return field.value;
          return field;
        };

        // Parse dates
        const parseDate = (dateObj?: { $date?: string }): Date | null => {
          if (!dateObj?.$date) return null;
          const date = new Date(dateObj.$date);
          return isNaN(date.getTime()) ? null : date;
        };

        // Create document with all related data
        await prisma.document.create({
          data: {
            id: doc._id,
            name: doc.name,
            filePath: doc.filePath,
            fileSize: BigInt(doc.fileSize.$numberLong),
            fileType: doc.fileType,
            status: doc.status,
            organizationId: doc.organizationId,
            departmentId: doc.departmentId,
            createdAt: parseDate(doc.createdAt) || new Date(),
            updatedAt: parseDate(doc.updatedAt) || new Date(),
            processedAt: parseDate(doc.processedAt),
            analyticsId: doc.analyticsId,
            
            // Invoice data
            invoice: doc.extractedData?.llmData?.invoice?.value ? {
              create: {
                invoiceId: doc.extractedData.llmData.invoice.value.invoiceId?.value,
                invoiceDate: parseDate({ $date: doc.extractedData.llmData.invoice.value.invoiceDate?.value }),
                deliveryDate: parseDate({ $date: doc.extractedData.llmData.invoice.value.deliveryDate?.value }),
                confidence: parseConfidence(doc.extractedData.llmData.invoice.value.invoiceId?.confidence),
              }
            } : undefined,
            
            // Vendor data
            vendor: doc.extractedData?.llmData?.vendor?.value ? {
              create: {
                vendorName: doc.extractedData.llmData.vendor.value.vendorName?.value,
                vendorAddress: doc.extractedData.llmData.vendor.value.vendorAddress?.value,
                vendorTaxId: doc.extractedData.llmData.vendor.value.vendorTaxId?.value,
                confidence: parseConfidence(doc.extractedData.llmData.vendor.value.vendorName?.confidence),
              }
            } : undefined,
            
            // Customer data
            customer: doc.extractedData?.llmData?.customer?.value ? {
              create: {
                customerName: doc.extractedData.llmData.customer.value.customerName?.value,
                customerAddress: doc.extractedData.llmData.customer.value.customerAddress?.value,
                customerTaxId: doc.extractedData.llmData.customer.value.customerTaxId?.value,
                confidence: parseConfidence(doc.extractedData.llmData.customer.value.customerName?.confidence),
              }
            } : undefined,
            
            // Payment data
            payment: doc.extractedData?.llmData?.payment?.value ? {
              create: {
                dueDate: parseDate({ $date: doc.extractedData.llmData.payment.value.dueDate?.value }),
                paymentTerms: doc.extractedData.llmData.payment.value.paymentTerms?.value,
                bankAccountNumber: doc.extractedData.llmData.payment.value.bankAccountNumber?.value,
                netDays: typeof extractValue(doc.extractedData.llmData.payment.value.netDays) === 'number' 
                  ? extractValue(doc.extractedData.llmData.payment.value.netDays) 
                  : null,
                discountPercentage: typeof extractValue(doc.extractedData.llmData.payment.value.discountPercentage) === 'number'
                  ? extractValue(doc.extractedData.llmData.payment.value.discountPercentage)
                  : null,
                confidence: parseConfidence(doc.extractedData.llmData.payment.value.bankAccountNumber?.confidence),
              }
            } : undefined,
            
            // Summary data
            summary: doc.extractedData?.llmData?.summary?.value ? {
              create: {
                subTotal: doc.extractedData.llmData.summary.value.subTotal?.value,
                totalTax: doc.extractedData.llmData.summary.value.totalTax?.value,
                invoiceTotal: doc.extractedData.llmData.summary.value.invoiceTotal?.value,
                documentType: extractValue(doc.extractedData.llmData.summary.value.documentType),
                currencySymbol: extractValue(doc.extractedData.llmData.summary.value.currencySymbol),
                confidence: parseConfidence(doc.extractedData.llmData.summary.value.invoiceTotal?.confidence),
              }
            } : undefined,
            
            // Line items data
            lineItems: doc.extractedData?.llmData?.lineItems?.value?.items?.value ? {
              create: doc.extractedData.llmData.lineItems.value.items.value.map((item, index) => ({
                srNo: item.srNo?.value || index + 1,
                description: item.description?.value,
                quantity: item.quantity?.value,
                unitPrice: item.unitPrice?.value,
                amount: item.amount?.value,
                vatRate: item.vatRate?.value,
                vatAmount: item.vatAmount?.value,
                confidence: parseConfidence(item.description?.confidence),
              }))
            } : undefined,
          }
        });

        imported++;
        console.log(`✓ Imported document ${doc._id} (${imported}/${documents.length})`);
      } catch (error) {
        console.error(`✗ Failed to import document ${doc._id}:`, error);
        skipped++;
      }
    }

    console.log(`\n✓ Import completed!`);
    console.log(`  - Imported: ${imported}`);
    console.log(`  - Skipped: ${skipped}`);
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importData()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });