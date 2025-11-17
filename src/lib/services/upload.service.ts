/**
 * Upload Service
 * Handles file upload and deletion operations
 */

import { apiClient } from "./api-client.service";
import { BaseService, ApiException } from "./base.service";

class UploadService extends BaseService {
  /**
   * Upload a file to Cloudinary
   */
  async uploadFile(file: File, folder?: string): Promise<{ url: string; publicId: string }> {
    try {
      if (!file) {
        throw new ApiException("File is required");
      }
      return await apiClient.uploadFile(file, folder);
    } catch (error) {
      throw this.handleError(error, "Failed to upload file");
    }
  }

  /**
   * Delete an uploaded file from Cloudinary
   */
  async deleteFile(publicId?: string, url?: string): Promise<void> {
    try {
      if (!publicId && !url) {
        throw new ApiException("Either publicId or url is required");
      }
      await apiClient.deleteUploadedFile(publicId, url);
    } catch (error) {
      throw this.handleError(error, "Failed to delete file");
    }
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown, defaultMessage: string): ApiException {
    if (error instanceof ApiException) {
      return error;
    }
    return new ApiException(
      error instanceof Error ? error.message : defaultMessage,
      undefined,
      error
    );
  }
}

// Export singleton instance
export const uploadService = new UploadService();

