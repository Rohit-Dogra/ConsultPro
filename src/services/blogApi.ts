const API_BASE_URL = 'http://localhost:3001/api';

export interface Comment {
  id: string;
  content: string;
  user_name: string;
  profile_picture?: string;
  created_at: string;
}

export interface Blog {
  id: string;
  title: string;
  summary: string;
  content: string;
  author_name: string;
  profile_picture?: string;
  category: string;
  read_time: number;
  views: number;
  likes_count: number;
  comments_count: number;
  cover_image: string;
  published_at: string;
}

export const blogApi = {
  // Get all blogs
  getAllBlogs: async (): Promise<Blog[]> => {
    const response = await fetch(`${API_BASE_URL}/blogs`);
    if (!response.ok) throw new Error('Failed to fetch blogs');
    return response.json();
  },

  // Get blog by ID
  getBlog: async (id: string): Promise<Blog> => {
    const response = await fetch(`${API_BASE_URL}/blogs/${id}`);
    if (!response.ok) throw new Error('Failed to fetch blog');
    return response.json();
  },

  // Get comments for a blog
  getComments: async (blogId: string): Promise<Comment[]> => {
    const response = await fetch(`${API_BASE_URL}/blogs/${blogId}/comments`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    return response.json();
  },

  // Add comment to blog
  addComment: async (blogId: string, userId: string, content: string): Promise<{ success: boolean; id: string }> => {
    const response = await fetch(`${API_BASE_URL}/blogs/${blogId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, content })
    });
    if (!response.ok) throw new Error('Failed to add comment');
    return response.json();
  },

  // Toggle like on blog
  toggleLike: async (blogId: string, userId: string): Promise<{ success: boolean; liked: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/blogs/${blogId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    if (!response.ok) throw new Error('Failed to toggle like');
    return response.json();
  },

  // Toggle save on blog
  toggleSave: async (blogId: string, userId: string): Promise<{ success: boolean; saved: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/blogs/${blogId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    if (!response.ok) throw new Error('Failed to toggle save');
    return response.json();
  }
};