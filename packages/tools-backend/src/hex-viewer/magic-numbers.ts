// 文件路径: packages/tools-backend/src/hex-viewer/magic-numbers.ts
// 生命周期：R（运行时由工具加载）

export interface MagicEntry {
  /** 文件头十六进制前缀，如 "89504E47" */
  hex: string;
  /** 人类可读的文件类型 */
  type: string;
  /** 可能的扩展名 */
  extensions: string[];
}

// 常见魔数表，可随时扩充
export const MAGIC_NUMBERS: MagicEntry[] = [
  { hex: "89504E47", type: "PNG image", extensions: ["png"] },
  { hex: "FFD8FF", type: "JPEG image", extensions: ["jpg", "jpeg"] },
  { hex: "47494638", type: "GIF image", extensions: ["gif"] },
  { hex: "49492A00", type: "TIFF image (little-endian)", extensions: ["tif", "tiff"] },
  { hex: "4D4D002A", type: "TIFF image (big-endian)", extensions: ["tif", "tiff"] },
  { hex: "52494646", type: "RIFF container (may be WEBP, AVI, WAV)", extensions: ["webp", "avi", "wav"] },
  { hex: "25504446", type: "PDF document", extensions: ["pdf"] },
  { hex: "504B0304", type: "ZIP archive / Office file", extensions: ["zip", "docx", "xlsx", "pptx"] },
  { hex: "504B0506", type: "Empty ZIP archive", extensions: ["zip"] },
  { hex: "52617221", type: "RAR archive", extensions: ["rar"] },
  { hex: "377ABCAF271C", type: "7-Zip archive", extensions: ["7z"] },
  { hex: "1F8B08", type: "GZIP compressed", extensions: ["gz"] },
  { hex: "000001BA", type: "MPEG transport stream", extensions: ["mpg", "mpeg"] },
  { hex: "000001B3", type: "MPEG video", extensions: ["mpg", "mpeg"] },
  { hex: "3026B2758E66CF", type: "Windows Media (ASF)", extensions: ["asf", "wmv"] },
  { hex: "464C5601", type: "FLV video", extensions: ["flv"] },
  { hex: "0000001C66747970", type: "MP4 video", extensions: ["mp4"] },
  { hex: "494433", type: "MP3 audio with ID3 tag", extensions: ["mp3"] },
  { hex: "FFFB", type: "MP3 audio (raw frame)", extensions: ["mp3"] },
  { hex: "4F676753", type: "OGG container", extensions: ["ogg", "ogv", "opus"] },
  { hex: "664C6143", type: "FLAC audio", extensions: ["flac"] },
  { hex: "0000000C6A502020", type: "JPEG 2000", extensions: ["jp2"] },
  { hex: "D0CF11E0", type: "MS Office (OLE2)", extensions: ["doc", "xls", "ppt"] },
  { hex: "GIF89a", type: "GIF89a (text form)", extensions: ["gif"] },
  // UE GVAS 存档我们单独处理，这里先不写，后面会通过工具自身识别
];