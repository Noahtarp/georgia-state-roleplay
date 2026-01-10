# Images Setup Guide

## Overview
This guide explains how to add your logo and application banners to the website.

## Image Requirements

### 1. Main Logo (`/public/images/logo.png`)
- **Purpose:** Used in the header navigation on all pages
- **Recommended Size:** 200x50px or proportional (width should be around 200-300px)
- **Format:** PNG with transparency (recommended) or JPG
- **Aspect Ratio:** Horizontal logo works best
- **Background:** Transparent or dark background that matches the dark theme

### 2. Staff Application Banner (`/public/images/banner-staff.png`)
- **Purpose:** Displayed when user selects "Staff" application type
- **Recommended Size:** 800x200px or similar aspect ratio
- **Format:** PNG or JPG
- **Background:** Should match dark theme

### 3. GSP Application Banner (`/public/images/banner-gsp.png`)
- **Purpose:** Displayed when user selects "Georgia State Patrol (GSP)" application type
- **Recommended Size:** 800x200px or similar aspect ratio
- **Format:** PNG or JPG
- **Background:** Should match dark theme

### 4. FBI Application Banner (`/public/images/banner-fbi.png`)
- **Purpose:** Displayed when user selects "FBI" application type
- **Recommended Size:** 800x200px or similar aspect ratio
- **Format:** PNG or JPG
- **Background:** Should match dark theme

## How to Add Images

1. **Create or obtain your images** in the sizes listed above
2. **Save them** in the `/public/images/` directory with the exact filenames:
   - `logo.png`
   - `banner-staff.png`
   - `banner-gsp.png`
   - `banner-fbi.png`

3. **Test the website** - The images should appear automatically

## Image Optimization Tips

- **Compress images** to reduce file size while maintaining quality
- **Use PNG** for logos with transparency
- **Use JPG** for banners if file size is a concern
- **Optimize for web** using tools like TinyPNG or ImageOptim

## Current Theme Colors

- **Primary Color:** #fdcd04 (gold/yellow)
- **Background:** #0a0a0a (very dark black)
- **Cards:** #1a1a1a (dark gray)
- **Text:** #e0e0e0 (light gray)
- **Borders:** #333333 (medium gray)

Make sure your images complement these colors, especially if they have backgrounds.

## Troubleshooting

### Images not showing?
1. Check file names are exact (case-sensitive): `logo.png` not `Logo.png`
2. Ensure files are in `/public/images/` directory
3. Check browser console for 404 errors
4. Clear browser cache and reload

### Images look wrong?
1. Verify image dimensions match recommendations
2. Check image format (PNG/JPG)
3. Ensure images aren't corrupted
4. Test in different browsers

## Default Behavior

- **Logo:** Shows in header on all pages
- **Banners:** Only appear on `/apply` page when user selects an application type
- **Responsive:** All images automatically resize for mobile devices



