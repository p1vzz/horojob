param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,
  [string]$ProjectRoot = ''
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

$assetsDir = Join-Path $ProjectRoot 'assets'
$neutralColor = [System.Drawing.ColorTranslator]::FromHtml('#EEE7DA')

function New-Canvas {
  param(
    [int]$Width,
    [int]$Height,
    [System.Drawing.Color]$BackgroundColor = [System.Drawing.Color]::Empty
  )

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  if ($BackgroundColor.IsEmpty) {
    $graphics.Clear([System.Drawing.Color]::Transparent)
  } else {
    $graphics.Clear($BackgroundColor)
  }

  return @{
    Bitmap = $bitmap
    Graphics = $graphics
  }
}

function Save-ContainImage {
  param(
    [Parameter(Mandatory = $true)]
    [System.Drawing.Image]$Image,
    [Parameter(Mandatory = $true)]
    [int]$Width,
    [Parameter(Mandatory = $true)]
    [int]$Height,
    [double]$FillRatio = 0.8,
    [System.Drawing.Color]$BackgroundColor = [System.Drawing.Color]::Empty,
    [Parameter(Mandatory = $true)]
    [string]$TargetPath
  )

  $canvas = New-Canvas -Width $Width -Height $Height -BackgroundColor $BackgroundColor
  $graphics = $canvas.Graphics

  $targetMaxWidth = [Math]::Round($Width * $FillRatio)
  $targetMaxHeight = [Math]::Round($Height * $FillRatio)
  $scale = [Math]::Min($targetMaxWidth / $Image.Width, $targetMaxHeight / $Image.Height)
  $drawWidth = [Math]::Round($Image.Width * $scale)
  $drawHeight = [Math]::Round($Image.Height * $scale)
  $x = [Math]::Round(($Width - $drawWidth) / 2)
  $y = [Math]::Round(($Height - $drawHeight) / 2)
  $destRect = [System.Drawing.Rectangle]::FromLTRB($x, $y, $x + $drawWidth, $y + $drawHeight)

  $graphics.DrawImage($Image, $destRect)
  $graphics.Dispose()
  $canvas.Bitmap.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Bitmap.Dispose()
}

$sourceBitmap = [System.Drawing.Bitmap]::FromFile($SourcePath)

try {
  $emblemRect = [System.Drawing.Rectangle]::FromLTRB(81, 18, 363, 300)
  $emblemBitmap = New-Object System.Drawing.Bitmap($emblemRect.Width, $emblemRect.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $emblemGraphics = [System.Drawing.Graphics]::FromImage($emblemBitmap)
  $emblemGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $emblemGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $emblemGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $emblemGraphics.DrawImage(
    $sourceBitmap,
    [System.Drawing.Rectangle]::FromLTRB(0, 0, $emblemRect.Width, $emblemRect.Height),
    $emblemRect,
    [System.Drawing.GraphicsUnit]::Pixel
  )
  $emblemGraphics.Dispose()

  try {
    Copy-Item -Path $SourcePath -Destination (Join-Path $assetsDir 'horojob-logo-lockup.png') -Force
    Save-ContainImage -Image $emblemBitmap -Width 1024 -Height 1024 -FillRatio 0.74 -TargetPath (Join-Path $assetsDir 'horojob-emblem.png')
    Save-ContainImage -Image $emblemBitmap -Width 1024 -Height 1024 -FillRatio 0.74 -BackgroundColor $neutralColor -TargetPath (Join-Path $assetsDir 'icon.png')
    Save-ContainImage -Image $emblemBitmap -Width 1024 -Height 1024 -FillRatio 0.68 -TargetPath (Join-Path $assetsDir 'adaptive-icon.png')
    Save-ContainImage -Image $emblemBitmap -Width 48 -Height 48 -FillRatio 0.76 -BackgroundColor $neutralColor -TargetPath (Join-Path $assetsDir 'favicon.png')
    Save-ContainImage -Image $sourceBitmap -Width 1024 -Height 1024 -FillRatio 0.82 -TargetPath (Join-Path $assetsDir 'splash-icon.png')

    $drawableTargets = @{
      'drawable-mdpi' = 288
      'drawable-hdpi' = 432
      'drawable-xhdpi' = 576
      'drawable-xxhdpi' = 864
      'drawable-xxxhdpi' = 1152
    }

    foreach ($entry in $drawableTargets.GetEnumerator()) {
      $targetPath = Join-Path $ProjectRoot ("android/app/src/main/res/{0}/splashscreen_logo.png" -f $entry.Key)
      Save-ContainImage -Image $sourceBitmap -Width $entry.Value -Height $entry.Value -FillRatio 0.82 -TargetPath $targetPath
    }

    # Expo prebuild owns Android launcher mipmaps and regenerates them as webp.
    # Keep source assets under assets/ only to avoid duplicate native resources.
  } finally {
    $emblemBitmap.Dispose()
  }
} finally {
  $sourceBitmap.Dispose()
}
