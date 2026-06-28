const express = require("express");
const router = express.Router();

// Get database pool from app.locals
const getDb = (req) => {
  return req.app.locals.db;
};

// Initialize tables if they don't exist
// const initializeTables = async () => {
//   try {
//     const db = getDb();
//     await db.query(`
//       CREATE TABLE IF NOT EXISTS case_studies (
//         id varchar(36) NOT NULL DEFAULT (uuid()),
//         title varchar(255) NOT NULL,
//         headline varchar(500),
//         cover_image varchar(255),
//         challenges text,
//         failures text,
//         created_by varchar(36),
//         created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
//         updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         PRIMARY KEY (id)
//       )
//     `);
    
//     await db.query(`
//       CREATE TABLE IF NOT EXISTS case_study_paragraphs (
//         id varchar(36) NOT NULL DEFAULT (uuid()),
//         case_study_id varchar(36) NOT NULL,
//         text text NOT NULL,
//         order_index int NOT NULL DEFAULT 0,
//         created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
//         updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         PRIMARY KEY (id),
//         KEY idx_paragraphs_case_study (case_study_id),
//         KEY idx_paragraphs_order (case_study_id, order_index)
//       )
//     `);
    
//     console.log('✅ Case studies tables initialized');
//   } catch (error) {
//     console.error('❌ Failed to initialize case studies tables:', error);
//   }
// };

// initializeTables();

// Get all case studies
router.get("/", async (req, res) => {
  try {
    const db = getDb(req);
    if (!db) {
      return res.json([]);
    }
    const [rows] = await db.query(`
      SELECT cs.*, 
             csp.text as overview
      FROM case_studies cs
      LEFT JOIN case_study_paragraphs csp ON cs.id = csp.case_study_id AND csp.order_index = 0
      ORDER BY cs.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.json([]);
  }
});

// Get single case study by ID
router.get("/:id", async (req, res) => {
  try {
    const db = getDb(req);
    const [caseStudyRows] = await db.query(`
      SELECT * FROM case_studies WHERE id = ?
    `, [req.params.id]);

    if (caseStudyRows.length === 0) {
      return res.status(404).json({ error: "Case study not found" });
    }

    const [paragraphRows] = await db.query(`
      SELECT text FROM case_study_paragraphs 
      WHERE case_study_id = ? 
      ORDER BY order_index ASC
    `, [req.params.id]);

    const caseStudy = caseStudyRows[0];
    caseStudy.overview = paragraphRows.length > 0 ? paragraphRows[0].text : null;

    res.json(caseStudy);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch case study", details: err.message });
  }
});

// Seed database with sample case studies
router.post("/seed", async (req, res) => {
  try {
    const db = getDb(req);
    
    // Create tables first
    await db.query(`
      CREATE TABLE IF NOT EXISTS case_studies (
        id varchar(36) NOT NULL,
        title varchar(255) NOT NULL,
        headline varchar(500),
        cover_image varchar(255),
        challenges text,
        failures text,
        created_by varchar(36),
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS case_study_paragraphs (
        id int AUTO_INCREMENT,
        case_study_id varchar(36) NOT NULL,
        text text NOT NULL,
        order_index int NOT NULL DEFAULT 0,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_paragraphs_case_study (case_study_id),
        KEY idx_paragraphs_order (case_study_id, order_index)
      )
    `);
    
    // Sample case studies data
    const caseStudies = [
      {
        id: '1',
        title: 'Digital Transformation Success',
        headline: '40% increase in operational efficiency',
        cover_image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200',
        challenges: 'The client faced declining operational efficiency due to outdated legacy systems and manual processes that could not scale with their growing business demands.',
        failures: 'We implemented a comprehensive digital transformation strategy including cloud migration, process automation, and AI-powered analytics to streamline operations.'
      },
      {
        id: '2',
        title: 'Market Expansion Strategy',
        headline: 'Entered 5 new markets successfully',
        cover_image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200',
        challenges: 'A promising healthcare startup needed to expand beyond their initial market but lacked the strategic framework and market intelligence to identify optimal expansion opportunities.',
        failures: 'We conducted comprehensive market research, developed go-to-market strategies, and provided regulatory guidance for successful expansion into new geographic markets.'
      },
      {
        id: '3',
        title: 'Cost Optimization Program',
        headline: '$2.5M annual savings achieved',
        cover_image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200',
        challenges: 'Rising operational costs and inefficient resource allocation were impacting profitability. The client needed a systematic approach to identify and eliminate cost inefficiencies.',
        failures: 'We implemented a comprehensive cost optimization program focusing on supply chain efficiency, energy management, and process improvements using lean manufacturing principles.'
      }
    ];

    // Insert case studies
    for (const study of caseStudies) {
      await db.query(
        `INSERT IGNORE INTO case_studies (id, title, headline, cover_image, challenges, failures) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [study.id, study.title, study.headline, study.cover_image, study.challenges, study.failures]
      );
    }

    // Sample paragraphs for overview
    const paragraphs = [
      {
        case_study_id: '1',
        text: 'This comprehensive case study showcases our strategic approach to transforming business operations through digital innovation. We successfully modernized legacy systems and implemented cutting-edge automation solutions.',
        order_index: 0
      },
      {
        case_study_id: '2',
        text: 'Our market expansion strategy focused on identifying high-potential markets and developing tailored entry strategies. Through careful analysis and strategic partnerships, we enabled rapid market penetration.',
        order_index: 0
      },
      {
        case_study_id: '3',
        text: 'The cost optimization program delivered significant savings through systematic analysis and strategic improvements. Our approach focused on sustainable cost reduction while maintaining operational excellence.',
        order_index: 0
      }
    ];

    // Insert paragraphs
    for (const paragraph of paragraphs) {
      await db.query(
        `INSERT IGNORE INTO case_study_paragraphs (case_study_id, text, order_index) 
         VALUES (?, ?, ?)`,
        [paragraph.case_study_id, paragraph.text, paragraph.order_index]
      );
    }

    res.json({ success: true, message: 'Case studies seeded successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to seed case studies', details: err.message });
  }
});

module.exports = router;