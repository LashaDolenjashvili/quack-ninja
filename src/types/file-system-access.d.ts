export {};

declare global {
  type FileSystemHandlePermissionDescriptor = {
    mode?: "read" | "readwrite";
  };

  interface FileSystemFileHandle {
    queryPermission?: (
      descriptor?: FileSystemHandlePermissionDescriptor
    ) => Promise<PermissionState>;
    requestPermission?: (
      descriptor?: FileSystemHandlePermissionDescriptor
    ) => Promise<PermissionState>;
  }
}
