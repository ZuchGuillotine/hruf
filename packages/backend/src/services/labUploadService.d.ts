/**
 * @description      :
 * @author           :
 * @group            :
 * @created          : 17/05/2025 - 13:24:56
 *
 * MODIFICATION LOG
 * - Version         : 1.0.0
 * - Date            : 17/05/2025
 * - Author          :
 * - Modification    :
 **/
import type { Request } from 'express';
type UploadedFile = NonNullable<Request['files']>[string] & {
  name: string;
  data: Buffer;
  size: number;
  encoding: string;
  tempFilePath: string;
  truncated: boolean;
  mimetype: string;
  md5: string;
  mv(path: string): Promise<void>;
};
export interface UploadProgress {
  labResultId: number;
  status:
    | 'uploading'
    | 'processing'
    | 'extracting'
    | 'summarizing'
    | 'completed'
    | 'error'
    | 'retrying';
  progress: number;
  message?: string;
  error?: string;
}
export declare class LabUploadService {
  private uploadProgress;
  private biomarkerExtractionService;
  constructor();
  private validateFile;
  private saveFile;
  private createLabResult;
  private processLabResult;
  private updateProgress;
  getUploadProgress(labResultId: number): UploadProgress | undefined;
  uploadLabResult(file: UploadedFile, userId: number): Promise<number>;
}
export declare const labUploadService: LabUploadService;
export {};
//# sourceMappingURL=labUploadService.d.ts.map
