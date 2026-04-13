param(
  [string]$SourcePath = '',
  [string]$ProjectRoot = ''
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

$assetsDir = Join-Path $ProjectRoot 'assets'
$neutralColor = [System.Drawing.ColorTranslator]::FromHtml('#F3F0E9')

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

function New-ScaledPoint {
  param(
    [double]$X,
    [double]$Y,
    [double]$Scale
  )

  return [System.Drawing.PointF]::new([single]($X * $Scale), [single]($Y * $Scale))
}

function New-GraphicEmblemBitmap {
  param(
    [int]$Size = 1024
  )

  $canvas = New-Canvas -Width $Size -Height $Size
  $graphics = $canvas.Graphics
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $scale = $Size / 100.0
  $center = [single](50 * $scale)
  $goldColor = [System.Drawing.ColorTranslator]::FromHtml('#C9A84C')
  $highlightColor = [System.Drawing.ColorTranslator]::FromHtml('#FFF1BF')
  $ringDotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, $goldColor.R, $goldColor.G, $goldColor.B))
  $goldBrush = New-Object System.Drawing.SolidBrush($goldColor)
  $highlightBrush = New-Object System.Drawing.SolidBrush($highlightColor)
  $glyphBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, $goldColor.R, $goldColor.G, $goldColor.B))
  $glyphFont = New-Object System.Drawing.Font('Segoe UI Symbol', [single](5.2 * $scale), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $glyphFormat = New-Object System.Drawing.StringFormat
  $glyphFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $glyphFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
  $archPen = New-Object System.Drawing.Pen($goldColor, [single](1.44 * $scale))
  $scenePen = New-Object System.Drawing.Pen($goldColor, [single](1.22 * $scale))
  $sceneSoftPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, $goldColor.R, $goldColor.G, $goldColor.B), [single](1.02 * $scale))
  $figurePen = New-Object System.Drawing.Pen($highlightColor, [single](2.02 * $scale))
  $figureLegPen = New-Object System.Drawing.Pen($highlightColor, [single](2.12 * $scale))
  $figureFootPen = New-Object System.Drawing.Pen($highlightColor, [single](1.68 * $scale))
  $headPen = New-Object System.Drawing.Pen($highlightColor, [single](0.9 * $scale))

  try {
    foreach ($pen in @($archPen, $scenePen, $sceneSoftPen, $figurePen, $figureLegPen, $figureFootPen, $headPen)) {
      $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
      $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
      $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    }

    for ($index = 0; $index -lt 72; $index++) {
      $angle = (($index * 5) - 90) * [Math]::PI / 180
      $dotRadius = [single](0.34 * $scale)
      $x = [single](($center + ([Math]::Cos($angle) * (38 * $scale))) - $dotRadius)
      $y = [single](($center + ([Math]::Sin($angle) * (38 * $scale))) - $dotRadius)
      $graphics.FillEllipse($ringDotBrush, $x, $y, $dotRadius * 2, $dotRadius * 2)
    }

    $glyphs = @(
      [char]0x2648, [char]0x2649, [char]0x264A, [char]0x264B, [char]0x264C, [char]0x264D,
      [char]0x264E, [char]0x264F, [char]0x2650, [char]0x2651, [char]0x2652, [char]0x2653
    )

    for ($index = 0; $index -lt $glyphs.Count; $index++) {
      $angle = ((($index * 30) - 90) * [Math]::PI) / 180
      $x = [single]((50 + ([Math]::Cos($angle) * 39)) * $scale)
      $y = [single]((50.4 + ([Math]::Sin($angle) * 39)) * $scale)
      $graphics.DrawString($glyphs[$index], $glyphFont, $glyphBrush, [System.Drawing.PointF]::new($x, $y), $glyphFormat)
    }

    $sparkles = @(
      @{ X = 27; Y = 31; Size = 1.12 },
      @{ X = 72.1; Y = 31.2; Size = 1.18 },
      @{ X = 22.5; Y = 49; Size = 1.02 },
      @{ X = 34.5; Y = 79; Size = 0.74 },
      @{ X = 58.5; Y = 78.5; Size = 1.08 },
      @{ X = 70.8; Y = 65.8; Size = 1.02 }
    )

    foreach ($sparkle in $sparkles) {
      $size = $sparkle.Size
      $points = [System.Drawing.PointF[]]@(
        (New-ScaledPoint $sparkle.X ($sparkle.Y - (1.8 * $size)) $scale),
        (New-ScaledPoint ($sparkle.X + (0.6 * $size)) ($sparkle.Y - (0.6 * $size)) $scale),
        (New-ScaledPoint ($sparkle.X + (1.8 * $size)) $sparkle.Y $scale),
        (New-ScaledPoint ($sparkle.X + (0.6 * $size)) ($sparkle.Y + (0.6 * $size)) $scale),
        (New-ScaledPoint $sparkle.X ($sparkle.Y + (1.8 * $size)) $scale),
        (New-ScaledPoint ($sparkle.X - (0.6 * $size)) ($sparkle.Y + (0.6 * $size)) $scale),
        (New-ScaledPoint ($sparkle.X - (1.8 * $size)) $sparkle.Y $scale),
        (New-ScaledPoint ($sparkle.X - (0.6 * $size)) ($sparkle.Y - (0.6 * $size)) $scale)
      )
      $graphics.FillPolygon($highlightBrush, $points)
    }

    $starDots = @(
      @{ X = 33.2; Y = 25.4; R = 0.68 },
      @{ X = 67.5; Y = 25.4; R = 0.64 },
      @{ X = 22.7; Y = 58.6; R = 0.58 },
      @{ X = 34; Y = 51.5; R = 0.62 },
      @{ X = 67.4; Y = 56.8; R = 0.52 },
      @{ X = 63.6; Y = 68.2; R = 0.54 }
    )

    foreach ($dot in $starDots) {
      $radius = [single]($dot.R * $scale)
      $graphics.FillEllipse($highlightBrush, [single](($dot.X * $scale) - $radius), [single](($dot.Y * $scale) - $radius), $radius * 2, $radius * 2)
    }

    $archPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    try {
      $archPath.AddLine((New-ScaledPoint 42.3 72.3 $scale), (New-ScaledPoint 42.3 35.2 $scale))
      $archPath.AddBezier((New-ScaledPoint 42.3 35.2 $scale), (New-ScaledPoint 42.3 26.6 $scale), (New-ScaledPoint 46.9 20.6 $scale), (New-ScaledPoint 54 20.6 $scale))
      $archPath.AddBezier((New-ScaledPoint 54 20.6 $scale), (New-ScaledPoint 61.1 20.6 $scale), (New-ScaledPoint 65.7 26.6 $scale), (New-ScaledPoint 65.7 35.2 $scale))
      $archPath.AddLine((New-ScaledPoint 65.7 35.2 $scale), (New-ScaledPoint 65.7 72.3 $scale))
      $graphics.DrawPath($archPen, $archPath)
    } finally {
      $archPath.Dispose()
    }

    $headCircleRadius = [single](1.55 * $scale)
    $graphics.DrawEllipse($headPen, [single]((47.2 * $scale) - $headCircleRadius), [single]((24.6 * $scale) - $headCircleRadius), $headCircleRadius * 2, $headCircleRadius * 2)

    $archSparklePoints = [System.Drawing.PointF[]]@(
      (New-ScaledPoint 54 18.9 $scale),
      (New-ScaledPoint 54.8 20.4 $scale),
      (New-ScaledPoint 56.3 21.2 $scale),
      (New-ScaledPoint 54.8 22 $scale),
      (New-ScaledPoint 54 23.5 $scale),
      (New-ScaledPoint 53.2 22 $scale),
      (New-ScaledPoint 51.7 21.2 $scale),
      (New-ScaledPoint 53.2 20.4 $scale)
    )
    $graphics.FillPolygon($highlightBrush, $archSparklePoints)
    $graphics.DrawArc($scenePen, [single](58.8 * $scale), [single](23.8 * $scale), [single](3.3 * $scale), [single](5.4 * $scale), 105, 230)

    $stairSteps = @(
      @{
        Riser = [System.Drawing.PointF[]]@((New-ScaledPoint 24.5 70.2 $scale), (New-ScaledPoint 31.2 72.2 $scale), (New-ScaledPoint 31.2 75.2 $scale), (New-ScaledPoint 24.5 73.2 $scale))
        Top = [System.Drawing.PointF[]]@((New-ScaledPoint 24.5 70.2 $scale), (New-ScaledPoint 31.2 72.2 $scale), (New-ScaledPoint 36.9 69.4 $scale), (New-ScaledPoint 30.1 67.4 $scale))
      },
      @{
        Riser = [System.Drawing.PointF[]]@((New-ScaledPoint 30.1 67.4 $scale), (New-ScaledPoint 36.9 69.4 $scale), (New-ScaledPoint 36.9 72.4 $scale), (New-ScaledPoint 30.1 70.4 $scale))
        Top = [System.Drawing.PointF[]]@((New-ScaledPoint 30.1 67.4 $scale), (New-ScaledPoint 36.9 69.4 $scale), (New-ScaledPoint 42.6 66.6 $scale), (New-ScaledPoint 35.8 64.6 $scale))
      },
      @{
        Riser = [System.Drawing.PointF[]]@((New-ScaledPoint 35.8 64.6 $scale), (New-ScaledPoint 42.6 66.6 $scale), (New-ScaledPoint 42.6 69.6 $scale), (New-ScaledPoint 35.8 67.6 $scale))
        Top = [System.Drawing.PointF[]]@((New-ScaledPoint 35.8 64.6 $scale), (New-ScaledPoint 42.6 66.6 $scale), (New-ScaledPoint 48.3 63.8 $scale), (New-ScaledPoint 41.5 61.8 $scale))
      },
      @{
        Riser = [System.Drawing.PointF[]]@((New-ScaledPoint 41.5 61.8 $scale), (New-ScaledPoint 48.3 63.8 $scale), (New-ScaledPoint 48.3 66.8 $scale), (New-ScaledPoint 41.5 64.8 $scale))
        Top = [System.Drawing.PointF[]]@((New-ScaledPoint 41.5 61.8 $scale), (New-ScaledPoint 48.3 63.8 $scale), (New-ScaledPoint 54 61 $scale), (New-ScaledPoint 47.2 59 $scale))
      },
      @{
        Riser = [System.Drawing.PointF[]]@((New-ScaledPoint 47.2 59 $scale), (New-ScaledPoint 54 61 $scale), (New-ScaledPoint 54 64 $scale), (New-ScaledPoint 47.2 62 $scale))
        Top = [System.Drawing.PointF[]]@((New-ScaledPoint 47.2 59 $scale), (New-ScaledPoint 54 61 $scale), (New-ScaledPoint 59.7 58.2 $scale), (New-ScaledPoint 52.9 56.2 $scale))
      }
    )

    foreach ($step in $stairSteps) {
      $graphics.DrawPolygon($scenePen, $step.Riser)
      $graphics.DrawPolygon($scenePen, $step.Top)
    }

    $graphics.DrawLines($sceneSoftPen, [System.Drawing.PointF[]]@(
      (New-ScaledPoint 24.5 73.2 $scale),
      (New-ScaledPoint 31.2 75.2 $scale),
      (New-ScaledPoint 36.9 72.4 $scale),
      (New-ScaledPoint 42.6 69.6 $scale),
      (New-ScaledPoint 48.3 66.8 $scale),
      (New-ScaledPoint 54 64 $scale)
    ))

    $graphics.DrawLine($scenePen, (New-ScaledPoint 59.7 58.2 $scale), (New-ScaledPoint 72.2 58.2 $scale))
    $graphics.DrawLine($scenePen, (New-ScaledPoint 72.2 78.6 $scale), (New-ScaledPoint 72.2 37.2 $scale))
    $graphics.DrawLine($scenePen, (New-ScaledPoint 69.9 40.6 $scale), (New-ScaledPoint 72.2 37.2 $scale))
    $graphics.DrawLine($scenePen, (New-ScaledPoint 72.2 37.2 $scale), (New-ScaledPoint 74.5 40.6 $scale))

    $graphics.FillPolygon($highlightBrush, [System.Drawing.PointF[]]@(
      (New-ScaledPoint 53.7 44 $scale),
      (New-ScaledPoint 56.9 45.4 $scale),
      (New-ScaledPoint 58 49 $scale),
      (New-ScaledPoint 56.1 51.4 $scale),
      (New-ScaledPoint 53.1 50.5 $scale),
      (New-ScaledPoint 52.5 46.7 $scale)
    ))
    $graphics.FillPolygon($highlightBrush, [System.Drawing.PointF[]]@(
      (New-ScaledPoint 52.9 40.1 $scale),
      (New-ScaledPoint 51.2 40.5 $scale),
      (New-ScaledPoint 50.1 41.8 $scale),
      (New-ScaledPoint 49.8 43.4 $scale),
      (New-ScaledPoint 51 43.2 $scale),
      (New-ScaledPoint 52.1 42.9 $scale),
      (New-ScaledPoint 53 42 $scale),
      (New-ScaledPoint 53.4 41.3 $scale)
    ))
    $headRadius = [single](2.25 * $scale)
    $graphics.FillEllipse($highlightBrush, [single]((55 * $scale) - $headRadius), [single]((41.7 * $scale) - $headRadius), $headRadius * 2, $headRadius * 2)
    $graphics.DrawLine($figurePen, (New-ScaledPoint 54.5 45.3 $scale), (New-ScaledPoint 51.7 44.7 $scale))
    $graphics.DrawLine($figurePen, (New-ScaledPoint 51.7 44.7 $scale), (New-ScaledPoint 50.3 47.2 $scale))
    $graphics.DrawLine($figurePen, (New-ScaledPoint 56.6 46 $scale), (New-ScaledPoint 59.1 47.5 $scale))
    $graphics.DrawLine($figurePen, (New-ScaledPoint 59.1 47.5 $scale), (New-ScaledPoint 61.3 45.9 $scale))
    $graphics.DrawLine($figureLegPen, (New-ScaledPoint 54.8 50.9 $scale), (New-ScaledPoint 52.6 53.8 $scale))
    $graphics.DrawLine($figureLegPen, (New-ScaledPoint 52.6 53.8 $scale), (New-ScaledPoint 50.9 56.1 $scale))
    $graphics.DrawLine($figureLegPen, (New-ScaledPoint 56 50.8 $scale), (New-ScaledPoint 58.4 52.7 $scale))
    $graphics.DrawLine($figureLegPen, (New-ScaledPoint 58.4 52.7 $scale), (New-ScaledPoint 60.7 52 $scale))
    $graphics.DrawLine($figureFootPen, (New-ScaledPoint 50.8 56.2 $scale), (New-ScaledPoint 49.4 56.8 $scale))
    $graphics.DrawLine($figureFootPen, (New-ScaledPoint 60.7 52 $scale), (New-ScaledPoint 62.2 52 $scale))
  } finally {
    $ringDotBrush.Dispose()
    $goldBrush.Dispose()
    $highlightBrush.Dispose()
    $glyphBrush.Dispose()
    $glyphFont.Dispose()
    $glyphFormat.Dispose()
    $archPen.Dispose()
    $scenePen.Dispose()
    $sceneSoftPen.Dispose()
    $figurePen.Dispose()
    $figureLegPen.Dispose()
    $figureFootPen.Dispose()
    $headPen.Dispose()
    $graphics.Dispose()
  }

  return $canvas.Bitmap
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

function Save-TransparentLoaderEmblemImage {
  param(
    [Parameter(Mandatory = $true)]
    [System.Drawing.Bitmap]$Image,
    [int]$BackgroundCutoff = 72,
    [int]$ForegroundStart = 118,
    [int]$MinVisibleLuminance = 96,
    [int]$OutputAlphaFloor = 16,
    [double]$FillRatio = 0.72,
    [int]$OutputSize = 1024,
    [int]$IgnoreCornerFrom = 860,
    [int]$CropPadding = 24,
    [Parameter(Mandatory = $true)]
    [string]$TargetPath
  )

  $bitmap = New-Object System.Drawing.Bitmap($Image.Width, $Image.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $minX = $Image.Width
  $minY = $Image.Height
  $maxX = -1
  $maxY = -1

  for ($y = 0; $y -lt $Image.Height; $y++) {
    for ($x = 0; $x -lt $Image.Width; $x++) {
      $pixel = $Image.GetPixel($x, $y)
      $luminance = (0.2126 * $pixel.R) + (0.7152 * $pixel.G) + (0.0722 * $pixel.B)

      if ($luminance -le $BackgroundCutoff) {
        $alpha = 0
      } elseif ($luminance -ge $ForegroundStart) {
        $alpha = 255
      } else {
        $normalized = ($luminance - $BackgroundCutoff) / ($ForegroundStart - $BackgroundCutoff)
        $alpha = [Math]::Round([Math]::Pow($normalized, 1.35) * 255)
      }

      if ($luminance -lt $MinVisibleLuminance) {
        $alpha = 0
      }

      if ($x -ge $IgnoreCornerFrom -and $y -ge $IgnoreCornerFrom) {
        $alpha = 0
      }

      if ($alpha -gt 0) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }

      $bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
    }
  }

  try {
    if ($maxX -lt $minX -or $maxY -lt $minY) {
      throw "Failed to detect emblem bounds for $TargetPath."
    }

    $cropLeft = [Math]::Max(0, $minX - $CropPadding)
    $cropTop = [Math]::Max(0, $minY - $CropPadding)
    $cropRight = [Math]::Min($Image.Width - 1, $maxX + $CropPadding)
    $cropBottom = [Math]::Min($Image.Height - 1, $maxY + $CropPadding)
    $cropWidth = $cropRight - $cropLeft + 1
    $cropHeight = $cropBottom - $cropTop + 1

    $canvas = New-Canvas -Width $OutputSize -Height $OutputSize
    try {
      $graphics = $canvas.Graphics
      $targetMaxWidth = [Math]::Round($OutputSize * $FillRatio)
      $targetMaxHeight = [Math]::Round($OutputSize * $FillRatio)
      $scale = [Math]::Min($targetMaxWidth / $cropWidth, $targetMaxHeight / $cropHeight)
      $drawWidth = [Math]::Round($cropWidth * $scale)
      $drawHeight = [Math]::Round($cropHeight * $scale)
      $destX = [Math]::Round(($OutputSize - $drawWidth) / 2)
      $destY = [Math]::Round(($OutputSize - $drawHeight) / 2)
      $destRect = [System.Drawing.Rectangle]::FromLTRB($destX, $destY, $destX + $drawWidth, $destY + $drawHeight)
      $srcRect = [System.Drawing.Rectangle]::FromLTRB($cropLeft, $cropTop, $cropRight + 1, $cropBottom + 1)
      $graphics.DrawImage($bitmap, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
      $graphics.Dispose()
      for ($outY = 0; $outY -lt $OutputSize; $outY++) {
        for ($outX = 0; $outX -lt $OutputSize; $outX++) {
          $outPixel = $canvas.Bitmap.GetPixel($outX, $outY)
          if ($outPixel.A -lt $OutputAlphaFloor) {
            $canvas.Bitmap.SetPixel($outX, $outY, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
          }
        }
      }
      $targetDir = Split-Path $TargetPath -Parent
      $tempTargetPath = Join-Path $targetDir (([System.IO.Path]::GetRandomFileName()) + '.png')
      $canvas.Bitmap.Save($tempTargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
      if (Test-Path $TargetPath) {
        Remove-Item -Path $TargetPath -Force
      }
      Move-Item -Path $tempTargetPath -Destination $TargetPath
    } finally {
      $canvas.Bitmap.Dispose()
    }
  } finally {
    $bitmap.Dispose()
  }
}

$usingGeneratedEmblem = [string]::IsNullOrWhiteSpace($SourcePath)

if ($usingGeneratedEmblem) {
  $sourceBitmap = New-GraphicEmblemBitmap -Size 1024
} else {
  $sourceBitmap = [System.Drawing.Bitmap]::FromFile($SourcePath)
}

try {
  if ($usingGeneratedEmblem) {
    $sourceBitmap.Save((Join-Path $assetsDir 'horojob-emblem.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $sourceBitmap.Save((Join-Path $assetsDir 'horojob-logo-lockup.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  } else {
    Copy-Item -Path $SourcePath -Destination (Join-Path $assetsDir 'horojob-emblem.png') -Force
    Copy-Item -Path $SourcePath -Destination (Join-Path $assetsDir 'horojob-logo-lockup.png') -Force
  }
  Save-TransparentLoaderEmblemImage -Image $sourceBitmap -TargetPath (Join-Path $assetsDir 'horojob-emblem-loader-final.png')
  Save-ContainImage -Image $sourceBitmap -Width 1024 -Height 1024 -FillRatio 0.74 -BackgroundColor $neutralColor -TargetPath (Join-Path $assetsDir 'icon.png')
  Save-ContainImage -Image $sourceBitmap -Width 1024 -Height 1024 -FillRatio 0.68 -TargetPath (Join-Path $assetsDir 'adaptive-icon.png')
  Save-ContainImage -Image $sourceBitmap -Width 48 -Height 48 -FillRatio 0.76 -BackgroundColor $neutralColor -TargetPath (Join-Path $assetsDir 'favicon.png')
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
  $sourceBitmap.Dispose()
}
