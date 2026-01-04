// Polyfill for roundRect if needed
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
    };
}

// Helper function to get element by ID
const $ = (id) => document.getElementById(id);

// Business configuration elements
const businessNameInput = $('businessName');
const whatsappNumberInput = $('whatsappNumber');
const brandColorInput = $('brandColor');
const businessNameDisplay = $('businessNameDisplay');
const footerBusinessName = $('footerBusinessName');
const whatsappContactLink = $('whatsappContactLink');
const businessWebsiteLink = $('businessWebsiteLink');
const footerSeparator = $('footerSeparator');

// Form elements
const itemNameInput = $('itemName');
const amountCnyInput = $('amountCny');
const qtyInput = $('qty');
const cnyToUsdInput = $('cnyToUsd');
const usdToGhsInput = $('usdToGhs');
const feePctInput = $('feePct');
const profitPctInput = $('profitPct');

// Output elements
const outItemSpan = $('outItem');
const outCnySpan = $('outCny');
const outUsdSpan = $('outUsd');
const outUsdFeeSpan = $('outUsdFee');
const outGhsSpan = $('outGhs');
const outProfitAmountSpan = $('outProfitAmount');
const outGhsProfitSpan = $('outGhsProfit');

// Sections
const summarySection = $('summarySection');
const finalCardSection = $('finalCardSection');

// Image upload
const imgUploadInput = $('imgUpload');
const imgPreview = $('imgPreview');
const imgPreviewWrap = $('imgPreviewWrap');
const uploadLabel = document.querySelector('.upload-label');

// Canvas
const canvas = $('quoteCanvas');
const ctx = canvas.getContext('2d');

let uploadedImage = null;
let generatedImageDataUrl = null;

// Helper to sanitize WhatsApp number (only digits allowed)
function sanitizeWhatsAppNumber(number) {
    return number.replace(/[^0-9]/g, '');
}

// Load saved business settings
function loadBusinessSettings() {
    const savedBusinessName = localStorage.getItem('businessName') || 'openQuote';
    const savedWhatsappNumber = localStorage.getItem('whatsappNumber') || '';
    const savedBrandColor = localStorage.getItem('brandColor') || '#87CEEB';
    
    businessNameInput.value = savedBusinessName;
    whatsappNumberInput.value = savedWhatsappNumber;
    brandColorInput.value = savedBrandColor;
    
    applyBusinessSettings();
}

// Save and apply business settings
function saveBusinessSettings() {
    // Sanitize WhatsApp number before saving
    const sanitizedNumber = sanitizeWhatsAppNumber(whatsappNumberInput.value);
    whatsappNumberInput.value = sanitizedNumber;
    
    localStorage.setItem('businessName', businessNameInput.value);
    localStorage.setItem('whatsappNumber', sanitizedNumber);
    localStorage.setItem('brandColor', brandColorInput.value);
    applyBusinessSettings();
}

// Apply business settings to UI
function applyBusinessSettings() {
    const businessName = businessNameInput.value || 'openQuote';
    const whatsappNumber = sanitizeWhatsAppNumber(whatsappNumberInput.value);
    const brandColor = brandColorInput.value || '#87CEEB';
    
    // Update business name in header and footer
    businessNameDisplay.textContent = businessName;
    footerBusinessName.textContent = businessName;
    
    // Update theme color
    document.documentElement.style.setProperty('--primary', brandColor);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.content = brandColor;
    }
    
    // Update WhatsApp link (only if number has digits)
    if (whatsappNumber && whatsappNumber.length > 0) {
        whatsappContactLink.href = `https://wa.me/${whatsappNumber}`;
        whatsappContactLink.style.display = 'flex';
        footerSeparator.style.display = 'inline';
    } else {
        whatsappContactLink.style.display = 'none';
        footerSeparator.style.display = 'none';
    }
}

// Listen to business setting changes
businessNameInput.addEventListener('input', saveBusinessSettings);
whatsappNumberInput.addEventListener('input', saveBusinessSettings);
brandColorInput.addEventListener('input', saveBusinessSettings);

// Number formatter
function formatNumber(num, decimals = 2) {
    return Number(num || 0).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Calculate quote
function calculate() {
    const itemName = itemNameInput.value || 'Item';
    const amountCny = parseFloat(amountCnyInput.value) || 0;
    const qty = parseInt(qtyInput.value) || 1;
    const perUnitCny = amountCny / qty;
    
    const cnyToUsd = parseFloat(cnyToUsdInput.value) || 0.1408;
    const usdToGhs = parseFloat(usdToGhsInput.value) || 13;
    
    const usdBeforeFee = amountCny * cnyToUsd;
    const feePct = parseFloat(feePctInput.value) || 0;
    const usdAfterFee = usdBeforeFee * (1 + feePct / 100);
    
    const ghs = usdAfterFee * usdToGhs;
    const profitPct = parseFloat(profitPctInput.value) || 0;
    const ghsWithProfit = ghs * (1 + profitPct / 100);
    const ghsWithProfitRounded = Math.round(ghsWithProfit);
    const profitAmount = ghsWithProfitRounded - ghs;
    
    // Update output
    outItemSpan.textContent = itemName;
    outCnySpan.textContent = `${formatNumber(amountCny, 2)} CNY (${formatNumber(perUnitCny, 2)} per unit)`;
    outUsdSpan.textContent = formatNumber(usdBeforeFee, 2);
    outUsdFeeSpan.textContent = formatNumber(usdAfterFee, 2);
    outGhsSpan.textContent = formatNumber(ghs, 2);
    outProfitAmountSpan.textContent = `GH₵ ${formatNumber(profitAmount)}`;
    outGhsProfitSpan.textContent = `GH₵ ${formatNumber(ghsWithProfitRounded, 0)}`;
    
    summarySection.style.display = 'block';
    
    // Generate card
    const quoteData = {
        item: itemName,
        amount: amountCny,
        quantity: qty,
        usdBeforeFee,
        usdAfterFee,
        ghs,
        ghsWithProfit: ghsWithProfitRounded
    };
    
    generateCard(quoteData);
    finalCardSection.style.display = 'block';
    
    return quoteData;
}

// Generate card image
function generateCard(data) {
    const width = canvas.width;
    const height = canvas.height;
    const brandColor = brandColorInput.value || '#87CEEB';
    
    // Create gradient background with brand color
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    const color1 = adjustColorBrightness(brandColor, 20);
    const color2 = brandColor;
    const color3 = adjustColorBrightness(brandColor, 10);
    
    gradient.addColorStop(0, color1);
    gradient.addColorStop(0.5, color2);
    gradient.addColorStop(1, color3);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw header box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(20, 15, width - 40, 50, 12);
    ctx.fill();
    
    // Draw item name
    ctx.fillStyle = '#1d1d1f';
    ctx.font = 'bold 18px -apple-system, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(data.item, width / 2, 45);
    
    // Draw uploaded image if exists
    if (uploadedImage) {
        const maxWidth = width * 0.8;
        const maxHeight = height * 0.55;
        const scale = Math.min(maxWidth / uploadedImage.width, maxHeight / uploadedImage.height);
        const imgWidth = uploadedImage.width * scale;
        const imgHeight = uploadedImage.height * scale;
        const x = (width - imgWidth) / 2;
        const y = 85;
        
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, imgWidth, imgHeight, 16);
        ctx.clip();
        ctx.drawImage(uploadedImage, x, y, imgWidth, imgHeight);
        ctx.restore();
        
        // Add shadow and border
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, imgWidth, imgHeight, 16);
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
    }
    
    // Draw price box at bottom
    const priceY = height - 80;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(20, priceY - 20, width - 40, 60, 16);
    ctx.fill();
    
    // Draw price
    ctx.fillStyle = '#1d1d1f';
    ctx.font = 'bold 28px -apple-system, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`GH₵ ${formatNumber(data.ghsWithProfit, 0)}`, width / 2, priceY + 15);
    
    // Reset text align
    ctx.textAlign = 'left';
    
    // Save as data URL
    generatedImageDataUrl = canvas.toDataURL('image/png');
}

// Helper to adjust color brightness
function adjustColorBrightness(hex, percent) {
    // Convert hex to RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    // Adjust brightness
    r = Math.min(255, Math.max(0, r + (r * percent / 100)));
    g = Math.min(255, Math.max(0, g + (g * percent / 100)));
    b = Math.min(255, Math.max(0, b + (b * percent / 100)));
    
    // Convert back to hex
    return '#' + 
        Math.round(r).toString(16).padStart(2, '0') +
        Math.round(g).toString(16).padStart(2, '0') +
        Math.round(b).toString(16).padStart(2, '0');
}

// Calculate button
$('calcBtn').addEventListener('click', () => {
    calculate();
});

// Image upload
imgUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImage = new Image();
        uploadedImage.onload = () => {
            imgPreview.src = uploadedImage.src;
            imgPreviewWrap.style.display = 'block';
            uploadLabel.style.display = 'none';
            
            // Regenerate card if summary is visible
            if (summarySection.style.display !== 'none') {
                calculate();
            }
        };
        uploadedImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// Update quote button
$('updateQuoteBtn').addEventListener('click', () => {
    document.getElementById('calcForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    itemNameInput.focus();
});

// Share on WhatsApp
$('shareImageBtn').addEventListener('click', async () => {
    if (!generatedImageDataUrl) {
        generateCard(calculate());
    }
    
    const quoteData = calculate();
    const businessName = businessNameInput.value || 'openQuote';
    const whatsappNumber = whatsappNumberInput.value;
    
    try {
        const response = await fetch(generatedImageDataUrl);
        const blob = await response.blob();
        const fileName = (itemNameInput.value || 'quote').replace(/[^a-zA-Z0-9]/g, '_');
        const file = new File([blob], `${fileName}_quote.png`, { type: 'image/png' });
        
        let shareText = `🛍️ ${quoteData.item}\n💰 Price: GH₵ ${formatNumber(quoteData.ghsWithProfit, 0)}\n📦 Quantity: ${quoteData.quantity}\n\n✨ Professional quote from ${businessName}`;
        
        if (whatsappNumber) {
            shareText += `\nContact: https://wa.me/${whatsappNumber}`;
        }
        
        // Try native share (check if both share and canShare exist)
        let canShare = false;
        try {
            canShare = navigator.share && 
                      navigator.canShare && 
                      navigator.canShare({ files: [file] });
        } catch (e) {
            // canShare might not support files parameter
            canShare = false;
        }
        
        if (canShare) {
            try {
                await navigator.share({
                    title: `Quote for ${itemNameInput.value || 'Item'}`,
                    text: shareText,
                    files: [file]
                });
                return; // Exit if share was successful
            } catch (shareErr) {
                // Fall through to fallback if share was cancelled or failed
            }
        }
        
        // Fallback: open WhatsApp with text and download image
        const sanitizedNumber = sanitizeWhatsAppNumber(whatsappNumber);
        const whatsappUrl = sanitizedNumber 
            ? `https://wa.me/${sanitizedNumber}?text=${encodeURIComponent(shareText)}`
            : `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        
        window.open(whatsappUrl, '_blank');
        
        // Download image
        setTimeout(() => {
            const a = document.createElement('a');
            a.href = generatedImageDataUrl;
            a.download = `${fileName}_quote_for_whatsapp.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            alert('💬 WhatsApp opened in new tab\n📸 Quote image downloaded\n\nPaste the image in your WhatsApp chat!');
        }, 500);
    } catch (err) {
        // Fallback for errors
        const quoteData = calculate();
        const businessName = businessNameInput.value || 'openQuote';
        const sanitizedNumber = sanitizeWhatsAppNumber(whatsappNumberInput.value);
        let fallbackText = `🛍️ ${quoteData.item}\n💰 Price: GH₵ ${formatNumber(quoteData.ghsWithProfit, 0)}\n📦 Quantity: ${quoteData.quantity}\n\nContact ${businessName} for more details!`;
        
        const whatsappUrl = sanitizedNumber
            ? `https://wa.me/${sanitizedNumber}?text=${encodeURIComponent(fallbackText)}`
            : `https://wa.me/?text=${encodeURIComponent(fallbackText)}`;
        
        window.open(whatsappUrl, '_blank');
        
        // Try to download image
        const fileName = (itemNameInput.value || 'quote').replace(/[^a-zA-Z0-9]/g, '_');
        const a = document.createElement('a');
        a.href = generatedImageDataUrl;
        a.download = `${fileName}_quote.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});

// Initialize
loadBusinessSettings();
calculate();
