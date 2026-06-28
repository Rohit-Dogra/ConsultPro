import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Play, Clock, Eye, Heart, Bookmark, MessageCircle, ArrowRight } from 'lucide-react';
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { blogApi, type Blog } from '../services/blogApi';
import SEOHead from "../components/SEO/SEOHead";
import { pageSEOConfig } from "../config/seo";

interface BlogPost {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    bio: string;
  };
  category: string;
  tags: string[];
  readTime: number;
  views: number;
  likes: number;
  publishedAt: string;
  featured: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  videoUrl?: string;
  audioUrl?: string;
  coverImage: string;
}

const BlogPlatform = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [comments, setComments] = useState<{[key: string]: string[]}>({});
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const blogsData = await blogApi.getAllBlogs();
        setBlogs(blogsData);
      } catch (error) {
        console.error('Error fetching blogs:', error);
        // Fallback to mock data
        const mockBlogs: BlogPost[] = [
      {
        id: '1',
        title: 'Building Modern React Applications with TypeScript',
        summary: 'Learn how to create scalable and maintainable React applications using TypeScript. This comprehensive guide covers best practices, advanced patterns, and real-world examples.',
        content: 'Full blog content here...',
        author: {
          name: 'Sarah Chen',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
          bio: 'Senior Frontend Developer'
        },
        category: 'Strategy',
        tags: ['Digital Transformation', 'Leadership', 'Innovation'],
        readTime: 8,
        views: 2340,
        likes: 156,
        publishedAt: '2024-01-15',
        featured: true,
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800'
      },
      {
        id: '2',
        title: 'Marketing ROI Optimization Strategies',
        summary: 'Proven strategies to maximize your marketing return on investment through data analytics and performance tracking.',
        content: 'Full blog content here...',
        author: {
          name: 'Alex Rodriguez',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          bio: 'Marketing Analytics Expert'
        },
        category: 'Marketing',
        tags: ['ROI', 'Analytics', 'Digital Marketing'],
        readTime: 12,
        views: 1890,
        likes: 203,
        publishedAt: '2024-01-14',
        featured: false,
        hasAudio: true,
        audioUrl: '#',
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800'
      },
      {
        id: '3',
        title: 'AI-Powered Consulting Solutions',
        summary: 'How consulting firms are leveraging artificial intelligence and automation to deliver superior client outcomes.',
        content: 'Full blog content here...',
        author: {
          name: 'Emma Wilson',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
          bio: 'AI Strategy Consultant'
        },
        category: 'Tech',
        tags: ['AI', 'Automation', 'Innovation'],
        readTime: 6,
        views: 1456,
        likes: 89,
        publishedAt: '2024-01-13',
        featured: false,
        hasVideo: false,
        hasAudio: false,
        coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'
      },
      {
        id: '4',
        title: 'Financial Planning for Startups',
        summary: 'Essential financial strategies and planning techniques for early-stage startups to ensure sustainable growth.',
        content: 'Full blog content here...',
        author: {
          name: 'Michael Chen',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          bio: 'Financial Advisor'
        },
        category: 'Finance',
        tags: ['Startup', 'Financial Planning', 'Investment'],
        readTime: 10,
        views: 2100,
        likes: 178,
        publishedAt: '2024-01-12',
        featured: false,
        hasVideo: true,
        videoUrl: '#',
        coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800'
      },
      {
        id: '5',
        title: 'Digital Transformation Roadmap',
        summary: 'A comprehensive guide to planning and executing digital transformation initiatives in traditional businesses.',
        content: 'Full blog content here...',
        author: {
          name: 'Lisa Park',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
          bio: 'Digital Strategy Expert'
        },
        category: 'Strategy',
        tags: ['Digital Transformation', 'Change Management', 'Technology'],
        readTime: 15,
        views: 3200,
        likes: 245,
        publishedAt: '2024-01-11',
        featured: false,
        hasVideo: false,
        hasAudio: true,
        audioUrl: '#',
        coverImage: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800'
      },
      {
        id: '6',
        title: 'Customer Experience Excellence',
        summary: 'Best practices for creating exceptional customer experiences that drive loyalty and business growth.',
        content: 'Full blog content here...',
        author: {
          name: 'David Kim',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          bio: 'CX Strategy Consultant'
        },
        category: 'Marketing',
        tags: ['Customer Experience', 'Service Design', 'Brand Loyalty'],
        readTime: 9,
        views: 1750,
        likes: 134,
        publishedAt: '2024-01-10',
        featured: false,
        hasVideo: false,
        hasAudio: false,
        coverImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800'
      }
        ];
        setBlogs(mockBlogs as any);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogs();
  }, []);

  const addComment = (blogId: string) => {
    if (newComment.trim()) {
      setComments(prev => ({
        ...prev,
        [blogId]: [...(prev[blogId] || []), newComment.trim()]
      }));
      setNewComment('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title={pageSEOConfig.blog.title}
        description={pageSEOConfig.blog.description}
        keywords={pageSEOConfig.blog.keywords}
        url="https://expertisestation.com/blog"
      />
      <Navbar />
      <main className="container mx-auto py-12 px-4 pt-24">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Expert Insights
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover strategic insights and expert knowledge to accelerate your growth
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading blogs...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {blogs.map((blog) => (
            <Card key={blog.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 bg-white border border-gray-200 rounded-xl h-full flex flex-col">
              <div className="relative overflow-hidden">
                <img 
                  src={blog.cover_image || blog.coverImage} 
                  alt={blog.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-blue-600 text-white text-xs px-2 py-1">
                    {blog.category}
                  </Badge>
                </div>
                {blog.hasVideo && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-red-500 text-white text-xs">
                      <Play className="h-3 w-3" />
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardContent className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 h-14">
                  {blog.title}
                </h3>
                
                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3 h-16">
                  {blog.summary}
                </p>
                
                <div className="flex items-center gap-3 mb-4 h-10">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={blog.profile_picture || blog.author?.avatar} />
                    <AvatarFallback>{(blog.author_name || blog.author?.name)[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{blog.author_name || blog.author?.name}</p>
                    <p className="text-xs text-gray-500">{blog.read_time || blog.readTime} min read</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="px-2 h-8 text-xs">
                      <Heart className="h-4 w-4 mr-1" />
                      {blog.likes_count || blog.likes || 0}
                    </Button>
                    <Button variant="ghost" size="sm" className="px-2 h-8 text-xs">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {blog.comments_count || 0}
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => navigate(`/blog/${blog.id}`)}
                  >
                    Read More
                  </Button>
                </div>
                
                {/* <div className="mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3 h-6">
                    <MessageCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Comments ({(comments[blog.id] || []).length})</span>
                  </div>
                  
                  <div className="h-20 overflow-y-auto mb-3">
                    {(comments[blog.id] || []).slice(0, 2).map((comment, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-2 mb-2 text-sm text-gray-700">
                        {comment}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && addComment(blog.id)}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => addComment(blog.id)}
                      className="bg-gray-600 text-white hover:bg-gray-700"
                    >
                      Post
                    </Button>
                  </div>
                </div> */}
              </CardContent>
            </Card>
            ))}
          </div>
        )}

        <div className="text-center mb-16">
          <Button 
            variant="outline" 
            className="rounded-full px-8 py-3 hover:bg-blue-50 border-2 hover:border-blue-300 transition-all duration-300"
          >
            Load More Insights
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Share Your Expertise
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join Expertise Station to share your knowledge and insights with professionals worldwide
          </p>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full px-8 py-3 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            Join Expertise Station
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPlatform;