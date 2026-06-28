const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

// Get database pool from server.js
const getDb = () => {
  const app = require('../server');
  return app.pool;
};

/**
 * BLOGS ROUTES
 */
 
// 📌 Get all blogs with interaction counts
router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query(
      `SELECT b.*, u.name AS author_name, u.avatar AS profile_picture,
       (SELECT COUNT(*) FROM blog_comments WHERE blog_id = b.id) AS comments_count,
       (SELECT COUNT(*) FROM blog_likes WHERE blog_id = b.id) AS likes_count
       FROM blogs b 
       JOIN users u ON b.author_id = u.id 
       ORDER BY b.published_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

// 📌 Get single blog (and increment views)
router.get("/:id", async (req, res) => {
  try {
    const db = getDb();
    const blogId = req.params.id;

    // Increment views
    await db.query("UPDATE blogs SET views = views + 1 WHERE id = ?", [blogId]);

    // Fetch blog details + author info + interaction counts
    const [rows] = await db.query(
      `SELECT b.*, u.name AS author_name, u.avatar AS profile_picture,
       (SELECT COUNT(*) FROM blog_comments WHERE blog_id = b.id) AS comments_count,
       (SELECT COUNT(*) FROM blog_likes WHERE blog_id = b.id) AS likes_count
       FROM blogs b 
       JOIN users u ON b.author_id = u.id 
       WHERE b.id = ?`,
      [blogId]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Blog not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});

// 📌 Create new blog
router.post("/", async (req, res) => {
  try {
    const db = getDb();
    const { title, summary, content, category, read_time, author_id, cover_image } = req.body;
    const blogId = uuidv4();

    await db.query(
      `INSERT INTO blogs 
       (id, title, summary, content, category, read_time, author_id, cover_image) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [blogId, title, summary, content, category, read_time, author_id, cover_image]
    );

    res.status(201).json({ success: true, id: blogId });
  } catch (err) {
    res.status(500).json({ error: "Failed to create blog" });
  }
});

// 📌 Update blog
router.put("/:id", async (req, res) => {
  try {
    const db = getDb();
    const { title, summary, content, category, read_time, cover_image } = req.body;
    await db.query(
      `UPDATE blogs 
       SET title=?, summary=?, content=?, category=?, read_time=?, cover_image=? 
       WHERE id=?`,
      [title, summary, content, category, read_time, cover_image, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update blog" });
  }
});

// 📌 Delete blog
router.delete("/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.query("DELETE FROM blogs WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete blog" });
  }
});

/**
 * COMMENTS ROUTES
 */

// 📌 Get comments for a blog
router.get("/:id/comments", async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query(
      `SELECT c.*, u.name AS user_name, u.avatar AS profile_picture
       FROM blog_comments c 
       JOIN users u ON c.user_id = u.id
       WHERE c.blog_id = ?
       ORDER BY c.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// 📌 Add a comment
router.post("/:id/comments", async (req, res) => {
  try {
    const db = getDb();
    const commentId = uuidv4();
    const { user_id, content } = req.body;

    await db.query(
      "INSERT INTO blog_comments (id, blog_id, user_id, content) VALUES (?, ?, ?, ?)",
      [commentId, req.params.id, user_id, content]
    );

    res.status(201).json({ success: true, id: commentId });
  } catch (err) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

/**
 * LIKES ROUTES
 */

// 📌 Like/Unlike a blog (toggle)
router.post("/:id/like", async (req, res) => {
  try {
    const db = getDb();
    const { user_id } = req.body;
    const blogId = req.params.id;

    // Check if like exists
    const [rows] = await db.query(
      "SELECT * FROM blog_likes WHERE blog_id=? AND user_id=?",
      [blogId, user_id]
    );

    if (rows.length > 0) {
      // Unlike
      await db.query("DELETE FROM blog_likes WHERE blog_id=? AND user_id=?", [blogId, user_id]);
      return res.json({ success: true, liked: false });
    } else {
      // Like
      const likeId = uuidv4();
      await db.query("INSERT INTO blog_likes (id, blog_id, user_id) VALUES (?, ?, ?)", [
        likeId,
        blogId,
        user_id,
      ]);
      return res.json({ success: true, liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

/**
 * SAVED ROUTES
 */

// 📌 Save/Unsave a blog (toggle)
router.post("/:id/save", async (req, res) => {
  try {
    const db = getDb();
    const { user_id } = req.body;
    const blogId = req.params.id;

    // Check if already saved
    const [rows] = await db.query(
      "SELECT * FROM saved_blogs WHERE blog_id=? AND user_id=?",
      [blogId, user_id]
    );

    if (rows.length > 0) {
      // Unsave
      await db.query("DELETE FROM saved_blogs WHERE blog_id=? AND user_id=?", [blogId, user_id]);
      return res.json({ success: true, saved: false });
    } else {
      // Save
      const saveId = uuidv4();
      await db.query("INSERT INTO saved_blogs (id, blog_id, user_id) VALUES (?, ?, ?)", [
        saveId,
        blogId,
        user_id,
      ]);
      return res.json({ success: true, saved: true });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle save" });
  }
});

// 📌 Get saved blogs for a user
router.get("/user/:userId/saved", async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query(
      `SELECT b.* 
       FROM saved_blogs s 
       JOIN blogs b ON s.blog_id = b.id 
       WHERE s.user_id = ? 
       ORDER BY s.created_at DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch saved blogs" });
  }
});

module.exports = router;
