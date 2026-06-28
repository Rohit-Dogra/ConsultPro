import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';

interface InsightData {
  marketInsights: string[];
  strategyRecommendations: string[];
  customerInsights: string[];
  marketOverview: string;
  competitiveAnalysis: {
    competitor: string;
    marketShare: string;
    strengths: string;
    weaknesses: string;
  }[];
  positioningStrategy: string;
  growthOpportunities: {
    title: string;
    description: string;
  }[];
  financialMetrics: {
    cac: string;
    revenue: {
      month: string;
      projected: number;
      actual: number;
    }[];
  };
}

const getDashboardData = (): InsightData => {
  // Collect data from all dashboard tabs
  return {
    marketInsights: [
      "Market size estimated at $2.5 billion with 12% annual growth",
      "Identified 3 primary competitors with similar offerings",
      "Customer acquisition cost is 20% lower than industry average"
    ],
    strategyRecommendations: [
      "Focus on premium segment with higher profit margins",
      "Develop partnership with complementary service providers",
      "Implement subscription-based revenue model"
    ],
    customerInsights: [
      "Primary demographic: professionals aged 25-45",
      "Customer retention rate projected at 65%",
      "Key acquisition channels: social media and referrals"
    ],
    marketOverview: "The market for this product/service is estimated at $2.5 billion annually with a projected growth rate of 12% over the next five years.",
    competitiveAnalysis: [
      {
        competitor: "Competitor A",
        marketShare: "35%",
        strengths: "Strong brand, wide distribution",
        weaknesses: "Higher pricing, slower innovation"
      },
      {
        competitor: "Competitor B",
        marketShare: "20%",
        strengths: "Innovative features, good UX",
        weaknesses: "Limited market presence, weaker support"
      }
    ],
    positioningStrategy: "Position your business as a premium alternative with superior user experience and advanced features that justify a 15-20% price premium.",
    growthOpportunities: [
      {
        title: "Market Expansion",
        description: "Target adjacent markets with similar needs. Consider geographical expansion to regions with high growth potential."
      },
      {
        title: "Product Development",
        description: "Develop complementary products or services to increase lifetime value of existing customers."
      }
    ],
    financialMetrics: {
      cac: "$120",
      revenue: [
        { month: 'Jan', projected: 8000, actual: 7500 },
        { month: 'Feb', projected: 10000, actual: 9500 },
        { month: 'Mar', projected: 12000, actual: 12500 }
      ]
    }
  };
};

const downloadAsPDF = async () => {
  const data = getDashboardData();
  const doc = new jsPDF();
  let yOffset = 10;

  // Title
  doc.setFontSize(20);
  doc.text('Business Insights Report', 20, yOffset);
  yOffset += 20;

  // Market Insights
  doc.setFontSize(16);
  doc.text('Market Insights', 20, yOffset);
  yOffset += 10;
  doc.setFontSize(12);
  data.marketInsights.forEach(insight => {
    doc.text('• ' + insight, 25, yOffset);
    yOffset += 10;
  });

  // Strategy Recommendations
  yOffset += 10;
  doc.setFontSize(16);
  doc.text('Strategy Recommendations', 20, yOffset);
  yOffset += 10;
  doc.setFontSize(12);
  data.strategyRecommendations.forEach(strategy => {
    doc.text('• ' + strategy, 25, yOffset);
    yOffset += 10;
  });

  // Customer Insights
  yOffset += 10;
  doc.setFontSize(16);
  doc.text('Customer Insights', 20, yOffset);
  yOffset += 10;
  doc.setFontSize(12);
  data.customerInsights.forEach(insight => {
    doc.text('• ' + insight, 25, yOffset);
    yOffset += 10;
  });

  // Market Overview
  yOffset += 10;
  doc.setFontSize(16);
  doc.text('Market Overview', 20, yOffset);
  yOffset += 10;
  doc.setFontSize(12);
  const marketOverviewLines = doc.splitTextToSize(data.marketOverview, 170);
  marketOverviewLines.forEach(line => {
    doc.text(line, 20, yOffset);
    yOffset += 7;
  });

  // Financial Metrics
  yOffset += 10;
  doc.setFontSize(16);
  doc.text('Financial Metrics', 20, yOffset);
  yOffset += 10;
  doc.setFontSize(12);
  doc.text(`Customer Acquisition Cost: ${data.financialMetrics.cac}`, 20, yOffset);
  yOffset += 10;

  // Revenue Data
  doc.text('Revenue Overview:', 20, yOffset);
  yOffset += 10;
  data.financialMetrics.revenue.forEach(rev => {
    doc.text(`${rev.month}: Projected $${rev.projected}, Actual $${rev.actual}`, 25, yOffset);
    yOffset += 7;
  });

  doc.save('business-insights.pdf');
};

const downloadAsDOCX = async () => {
  const data = getDashboardData();
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: 'Business Insights Report',
          heading: HeadingLevel.TITLE
        }),
        // Market Insights
        new Paragraph({
          text: 'Market Insights',
          heading: HeadingLevel.HEADING_1
        }),
        ...data.marketInsights.map(insight => (
          new Paragraph({
            text: '• ' + insight
          })
        )),
        // Strategy Recommendations
        new Paragraph({
          text: 'Strategy Recommendations',
          heading: HeadingLevel.HEADING_1
        }),
        ...data.strategyRecommendations.map(strategy => (
          new Paragraph({
            text: '• ' + strategy
          })
        )),
        // Customer Insights
        new Paragraph({
          text: 'Customer Insights',
          heading: HeadingLevel.HEADING_1
        }),
        ...data.customerInsights.map(insight => (
          new Paragraph({
            text: '• ' + insight
          })
        )),
        // Market Overview
        new Paragraph({
          text: 'Market Overview',
          heading: HeadingLevel.HEADING_1
        }),
        new Paragraph({
          text: data.marketOverview
        }),
        // Financial Metrics
        new Paragraph({
          text: 'Financial Metrics',
          heading: HeadingLevel.HEADING_1
        }),
        new Paragraph({
          text: `Customer Acquisition Cost: ${data.financialMetrics.cac}`
        }),
        new Paragraph({
          text: 'Revenue Overview:'
        }),
        ...data.financialMetrics.revenue.map(rev => (
          new Paragraph({
            text: `${rev.month}: Projected $${rev.projected}, Actual $${rev.actual}`
          })
        ))
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'business-insights.docx';
  link.click();
  window.URL.revokeObjectURL(url);
};

export const downloadService = {
  downloadAsPDF,
  downloadAsDOCX
};