import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { ArrowLeft, Clock, Eye, Heart, Share2, Bookmark, Calendar } from 'lucide-react';
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { blogApi, type Blog, type Comment } from '../services/blogApi';

const BlogDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const contentRef = useRef(null);
  
  // Mock user ID - in real app, get from auth context
  const currentUserId = 'user-123';

  // Complete mockBlogs data preserved
  const mockBlogs = {
    '1': {
      id: '1',
      title: 'Building Modern React Applications with TypeScript',
      content: `<h2>Introduction</h2>
        <p>TypeScript has revolutionized the way we build React applications by providing static type checking and enhanced developer experience. In this comprehensive guide, we'll explore the best practices and advanced patterns for creating scalable and maintainable React applications.</p>
        <h2>Setting Up Your Development Environment</h2>
        <p>Before diving into development, it's crucial to set up a proper development environment. We'll cover the essential tools and configurations needed for a TypeScript React project.</p>
        <h2>Component Architecture</h2>
        <p>A well-structured component architecture is the foundation of any successful React application. We'll discuss component composition, prop interfaces, and state management patterns.</p>
        <h2>Advanced TypeScript Patterns</h2>
        <p>Learn about generic components, utility types, and advanced TypeScript features that can make your React code more robust and maintainable.</p>
        <h2>Performance Optimization</h2>
        <p>Discover techniques for optimizing your React TypeScript applications, including code splitting, memoization, and bundle optimization strategies.</p>
        <h2>Conclusion</h2>
        <p>Building modern React applications with TypeScript requires understanding both technologies deeply. By following the patterns and practices outlined in this guide, you'll be well-equipped to create professional-grade applications.</p>`,
      author: {
        name: 'Sarah Chen',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
        bio: 'Senior Frontend Developer with 8+ years of experience in React and TypeScript'
      },
      category: 'Strategy',
      tags: ['Digital Transformation', 'Leadership', 'Innovation'],
      readTime: 8,
      views: 2340,
      likes: 156,
      publishedAt: '2024-01-15',
      coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800'
    },
    '2': {
      id: '2',
      title: 'Marketing ROI Optimization Strategies',
      content: `<h2>Understanding Marketing ROI</h2>
        <p>Marketing Return on Investment (ROI) is a crucial metric that measures the effectiveness of your marketing campaigns. In today's competitive landscape, maximizing ROI through data analytics and performance tracking is essential for business success.</p>
        <h2>Data-Driven Decision Making</h2>
        <p>Learn how to leverage analytics tools and customer data to make informed marketing decisions that drive better results and higher returns on your marketing investments.</p>
        <h2>Performance Tracking Strategies</h2>
        <p>Discover the key metrics and KPIs that matter most for measuring marketing success and how to implement effective tracking systems across all your marketing channels.</p>
        <h2>Optimization Techniques</h2>
        <p>Explore proven strategies for optimizing your marketing campaigns, from A/B testing to audience segmentation and personalization tactics that increase conversion rates.</p>
        <h2>Future of Marketing Analytics</h2>
        <p>Stay ahead of the curve with insights into emerging trends in marketing analytics and how AI and machine learning are transforming the way we measure and optimize marketing performance.</p>`,
      author: {
        name: 'Alex Rodriguez',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        bio: 'Marketing Analytics Expert with 10+ years in digital marketing and data analysis'
      },
      category: 'Marketing',
      tags: ['ROI', 'Analytics', 'Digital Marketing'],
      readTime: 12,
      views: 1890,
      likes: 203,
      publishedAt: '2024-01-14',
      coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800'
    },
    '3': {
      id: '3',
      title: 'AI-Powered Consulting Solutions',
      content: `<h2>The AI Revolution in Consulting</h2>
        <p>Artificial intelligence is transforming the consulting industry, enabling firms to deliver superior client outcomes through automation, predictive analytics, and intelligent insights.</p>
        <h2>Automation in Client Services</h2>
        <p>Discover how consulting firms are using AI to automate routine tasks, streamline processes, and free up consultants to focus on high-value strategic work that drives client success.</p>
        <h2>Predictive Analytics for Better Outcomes</h2>
        <p>Learn about the power of predictive analytics in consulting, from forecasting market trends to identifying potential risks and opportunities for clients across various industries.</p>
        <h2>Innovation Through Technology</h2>
        <p>Explore how cutting-edge technologies like machine learning, natural language processing, and data visualization are creating new possibilities for innovative consulting solutions.</p>
        <h2>The Future of AI in Consulting</h2>
        <p>Get insights into emerging AI trends and technologies that will shape the future of consulting, and how firms can prepare for the next wave of digital transformation.</p>`,
      author: {
        name: 'Emma Wilson',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        bio: 'AI Strategy Consultant specializing in digital transformation and automation'
      },
      category: 'Tech',
      tags: ['AI', 'Automation', 'Innovation'],
      readTime: 6,
      views: 1456,
      likes: 89,
      publishedAt: '2024-01-13',
      coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'
    },
    '4': {
      id: '4',
      title: 'Financial Planning for Startups',
      content: `<h2>Building a Strong Financial Foundation</h2>
        <p>Essential financial strategies and planning techniques for early-stage startups to ensure sustainable growth and long-term success in competitive markets.</p>
        <h2>Cash Flow Management</h2>
        <p>Learn the fundamentals of cash flow management, budgeting, and financial forecasting that every startup founder needs to master for business sustainability.</p>
        <h2>Investment and Funding Strategies</h2>
        <p>Explore different funding options available to startups, from bootstrapping to venture capital, and how to prepare for successful fundraising rounds.</p>
        <h2>Financial Risk Management</h2>
        <p>Understand how to identify, assess, and mitigate financial risks that could impact your startup's growth trajectory and long-term viability.</p>
        <h2>Scaling Financial Operations</h2>
        <p>Discover best practices for scaling your financial operations as your startup grows, including systems, processes, and team building strategies.</p>`,
      author: {
        name: 'Michael Chen',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        bio: 'Financial Advisor with expertise in startup finance and investment strategies'
      },
      category: 'Finance',
      tags: ['Startup', 'Financial Planning', 'Investment'],
      readTime: 10,
      views: 2100,
      likes: 178,
      publishedAt: '2024-01-12',
      coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800'
    },
    '5': {
      id: '5',
      title: 'Digital Transformation Roadmap',
      content: `<h2>Planning Your Digital Journey</h2>
        <p>A comprehensive guide to planning and executing digital transformation initiatives in traditional businesses, ensuring successful adoption and measurable results.</p>
        <h2>Change Management Strategies</h2>
        <p>Learn effective change management techniques to help your organization navigate the challenges of digital transformation and ensure employee buy-in.</p>
        <h2>Technology Integration</h2>
        <p>Discover how to select and integrate the right technologies for your business needs, from cloud solutions to automation tools and data analytics platforms.</p>
        <h2>Measuring Success</h2>
        <p>Understand key metrics and KPIs for measuring the success of your digital transformation efforts and ensuring continuous improvement.</p>
        <h2>Future-Proofing Your Business</h2>
        <p>Explore strategies for building a resilient, adaptable organization that can thrive in an increasingly digital world.</p>`,
      author: {
        name: 'Lisa Park',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
        bio: 'Digital Strategy Expert with 12+ years in transformation consulting'
      },
      category: 'Strategy',
      tags: ['Digital Transformation', 'Change Management', 'Technology'],
      readTime: 15,
      views: 3200,
      likes: 245,
      publishedAt: '2024-01-11',
      coverImage: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800'
    },
    '6': {
      id: '6',
      title: 'Customer Experience Excellence',
      content: `<h2>The Customer Experience Imperative</h2>
        <p>Best practices for creating exceptional customer experiences that drive loyalty and business growth in today's competitive marketplace.</p>
        <h2>Service Design Principles</h2>
        <p>Learn the fundamental principles of service design and how to create seamless, delightful customer journeys across all touchpoints.</p>
        <h2>Building Brand Loyalty</h2>
        <p>Discover strategies for building lasting customer relationships and brand loyalty through consistent, personalized experiences.</p>
        <h2>Measuring Customer Satisfaction</h2>
        <p>Understand key metrics for measuring customer satisfaction and how to use feedback to continuously improve your customer experience.</p>
        <h2>Technology and CX</h2>
        <p>Explore how technology can enhance customer experiences, from AI-powered chatbots to personalization engines and omnichannel platforms.</p>`,
      author: {
        name: 'David Kim',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        bio: 'CX Strategy Consultant focused on service design and customer journey optimization'
      },
      category: 'Marketing',
      tags: ['Customer Experience', 'Service Design', 'Brand Loyalty'],
      readTime: 9,
      views: 1750,
      likes: 134,
      publishedAt: '2024-01-10',
      coverImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800'
    }
  };

  useEffect(() => {
    const fetchBlogData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        // Try to fetch from API first, fallback to mock data
        try {
          const blogData = await blogApi.getBlog(id);
          setBlog(blogData);
          const commentsData = await blogApi.getComments(id);
          setComments(commentsData);
        } catch (apiError) {
          // Fallback to mock data if API fails
          if (mockBlogs[id]) {
            setBlog(mockBlogs[id]);
          }
        }
      } catch (error) {
        console.error('Error fetching blog:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogData();
  }, [id]);

  const handleScroll = () => {
    const contentEl = contentRef.current;
    if (!contentEl) return;
    const { scrollTop, scrollHeight, clientHeight } = contentEl;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setShowComments(true);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim().length === 0 || !id) return;
    
    try {
      const result = await blogApi.addComment(id, currentUserId, newComment.trim());
      if (result.success) {
        // Refresh comments
        const updatedComments = await blogApi.getComments(id);
        setComments(updatedComments);
        setNewComment("");
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      // Fallback to local state for demo
      setComments([
        ...comments,
        { 
          id: Date.now().toString(),
          content: newComment, 
          user_name: 'Anonymous',
          created_at: new Date().toISOString()
        }
      ]);
      setNewComment("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Blog not found</h2>
          <Button onClick={() => navigate('/blog')} className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <Navbar />
      <main className="container mx-auto py-12 px-4 pt-24">
        <Button
          variant="outline"
          onClick={() => navigate('/blog')}
          className="mb-8 rounded-full px-6 py-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Insights
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-white shadow-xl rounded-3xl border-0 overflow-hidden">
              <div className="relative h-96 overflow-hidden">
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white mb-4">
                    {blog.category}
                  </Badge>
                  <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                    {blog.title}
                  </h1>
                </div>
              </div>
              <CardContent className="p-8">
                {/* Author info */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-blue-200">
                      <AvatarImage src={blog.author.avatar} />
                      <AvatarFallback>{blog.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{blog.author?.name || blog.author_name}</h3>
                      <p className="text-gray-600">{blog.author?.bio || 'Expert Author'}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(blog.publishedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {blog.readTime} min read
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-full">
                      <Heart className="h-4 w-4 mr-1" />
                      {blog.likes}
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {blog.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="rounded-full px-3 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {/* Blog Content */}
                <div
                  className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                  ref={contentRef}
                  onScroll={handleScroll}
                  style={{ maxHeight: '800px', overflowY: 'auto' }}
                  tabIndex={0}
                />
                {/* Comments Section */}
                <div className="mt-12">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Comments</h2>
                  <form onSubmit={handleCommentSubmit} className="flex flex-col gap-4 mb-6">
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Add your comment…"
                    />
                    <Button type="submit" className="rounded-full px-6 py-2 self-end">
                      Submit Comment
                    </Button>
                  </form>
                  <div>
                    {comments.length === 0 ? (
                      <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
                    ) : (
                      <ul className="space-y-4">
                        {comments.map((comment) => (
                          <li key={comment.id} className="bg-gray-50 rounded-lg p-4 border">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={comment.profile_picture} />
                                <AvatarFallback>{comment.user_name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="font-semibold text-gray-900 leading-tight">{comment.user_name}</span>
                              <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="mt-2 text-gray-700">{comment.content}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Article Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Eye className="h-4 w-4" /> Views
                    </span>
                    <span className="font-semibold">{blog.views.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Heart className="h-4 w-4" /> Likes
                    </span>
                    <span className="font-semibold">{blog.likes_count || blog.likes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" /> Read Time
                    </span>
                    <span className="font-semibold">{blog.readTime} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-0 shadow-lg rounded-2xl" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogDetails;
