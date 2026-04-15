// pdfService.js - PDF export functionality
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Export auction report to PDF
export const exportAuctionReport = async (reportData, reportType) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Title
    pdf.setFontSize(24);
    pdf.setTextColor(255, 215, 0); // Gold
    pdf.text('LBPL Auction Report', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Season 1 • 2026', pageWidth / 2, 30, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 40, { align: 'center' });
    
    let yPosition = 55;
    
    if (reportType === 'summary') {
      // Summary Stats
      pdf.setFontSize(18);
      pdf.setTextColor(255, 215, 0);
      pdf.text('Auction Summary', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Total Players Sold: ${reportData.soldCount || 0}`, 25, yPosition);
      yPosition += 8;
      pdf.text(`Total Auction Value: ${formatCurrency(reportData.totalValue || 0)}`, 25, yPosition);
      yPosition += 8;
      pdf.text(`Unsold Players: ${reportData.unsoldCount || 0}`, 25, yPosition);
      yPosition += 8;
      pdf.text(`Average Player Price: ${formatCurrency(reportData.avgPrice || 0)}`, 25, yPosition);
      yPosition += 20;
    }
    
    if (reportType === 'top10' || reportType === 'full') {
      // Top 10 Players
      pdf.setFontSize(18);
      pdf.setTextColor(255, 215, 0);
      pdf.text('Top 10 Highest Sold Players', 20, yPosition);
      yPosition += 15;
      
      // Table Header
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.setFillColor(255, 215, 0);
      pdf.rect(20, yPosition - 5, 170, 8, 'F');
      pdf.setTextColor(0, 0, 0);
      pdf.text('#', 25, yPosition);
      pdf.text('Player', 40, yPosition);
      pdf.text('Category', 90, yPosition);
      pdf.text('Team', 130, yPosition);
      pdf.text('Price', 170, yPosition);
      yPosition += 10;
      
      pdf.setTextColor(0, 0, 0);
      reportData.topPlayers?.slice(0, 10).forEach((player, index) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Alternate row background
        if (index % 2 === 0) {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(20, yPosition - 5, 170, 8, 'F');
        }
        
        pdf.text(`${index + 1}`, 25, yPosition);
        pdf.text(player.name?.substring(0, 20) || '', 40, yPosition);
        pdf.text(player.category || '', 90, yPosition);
        pdf.text(player.teams?.name?.substring(0, 15) || '', 130, yPosition);
        pdf.text(formatCurrency(player.sold_price), 170, yPosition);
        yPosition += 10;
      });
      yPosition += 15;
    }
    
    if (reportType === 'teams' || reportType === 'full') {
      // Team-wise breakdown
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(18);
      pdf.setTextColor(255, 215, 0);
      pdf.text('Team-wise Players', 20, yPosition);
      yPosition += 15;
      
      reportData.teams?.forEach((team, teamIndex) => {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${team.name} (Purse: ${formatCurrency(team.current_purse)})`, 25, yPosition);
        yPosition += 8;
        
        team.players?.forEach((player, pIndex) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(11);
          pdf.text(`  • ${player.name} - ${formatCurrency(player.sold_price)}`, 30, yPosition);
          yPosition += 6;
        });
        
        yPosition += 8;
      });
    }
    
    // Footer
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text('LBPL - Lourdes Badminton Premier League', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Save PDF
    pdf.save(`LBPL_Auction_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    
    return { success: true };
  } catch (error) {
    console.error('PDF export error:', error);
    return { success: false, error: error.message };
  }
};

// Export element as image and add to PDF
export const exportElementToPDF = async (elementId, title) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('Element not found');
    
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#0a0a1a'
    });
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.setFontSize(20);
    pdf.setTextColor(255, 215, 0);
    pdf.text(title, pageWidth / 2, 15, { align: 'center' });
    
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 25, imgWidth, imgHeight);
    pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
    
    return { success: true };
  } catch (error) {
    console.error('Element export error:', error);
    return { success: false, error: error.message };
  }
};

// Helper function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};