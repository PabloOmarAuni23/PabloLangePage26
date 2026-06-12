Add-Type -AssemblyName System.Drawing

$sources = @(
  "images\hero\slide-1.jpg",
  "images\hero\slide-2.jpg",
  "images\hero\slide-3.jpg",
  "images\historia\foto-1.jpg",
  "images\historia\foto-2.jpg",
  "images\historia\foto-3.jpg"
)

$backupDir = "private\original-images"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq "image/jpeg" }

function Save-Jpeg($bitmap, $path, $quality) {
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality,
    [int64]$quality
  )
  $bitmap.Save($path, $jpegCodec, $params)
}

function Enhance-Image($sourcePath) {
  $full = Resolve-Path $sourcePath
  $name = Split-Path $sourcePath -Leaf
  $backupPath = Join-Path $backupDir $name
  if (-not (Test-Path $backupPath)) {
    Copy-Item -LiteralPath $full -Destination $backupPath
  }

  $original = [System.Drawing.Image]::FromFile($full)
  $width = $original.Width
  $height = $original.Height

  $bitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  $contrast = 1.12
  $brightness = 0.045
  $translate = (1.0 - $contrast) / 2.0 + $brightness
  $matrix = New-Object System.Drawing.Imaging.ColorMatrix
  $matrix.Matrix00 = $contrast
  $matrix.Matrix11 = $contrast
  $matrix.Matrix22 = $contrast
  $matrix.Matrix33 = 1.0
  $matrix.Matrix40 = $translate
  $matrix.Matrix41 = $translate
  $matrix.Matrix42 = $translate
  $matrix.Matrix44 = 1.0

  $attrs = New-Object System.Drawing.Imaging.ImageAttributes
  $attrs.SetColorMatrix($matrix)
  $rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
  $graphics.DrawImage($original, $rect, 0, 0, $width, $height, [System.Drawing.GraphicsUnit]::Pixel, $attrs)
  $attrs.Dispose()
  $graphics.Dispose()
  $original.Dispose()

  $tempPath = "$sourcePath.tmp.jpg"
  Save-Jpeg $bitmap $tempPath 92
  $bitmap.Dispose()
  Move-Item -LiteralPath $tempPath -Destination $sourcePath -Force
}

foreach ($source in $sources) {
  Enhance-Image $source
}
