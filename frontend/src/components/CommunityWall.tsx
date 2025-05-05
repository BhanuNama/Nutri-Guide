import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, MessageSquare, Heart, Share, MoreHorizontal, Clock, User } from 'lucide-react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  _id: string;
  content: string;
  userId: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
  likes?: string[];
}

interface ApiError {
  message?: string;
}

const CommunityWall: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  
  // Get token and user info from localStorage
  const token = localStorage.getItem('neutroToken') || '';
  const userId = localStorage.getItem('neutroUserId') || '';
  const userName = localStorage.getItem('neutroUserName') || '';

  // Axios instance with auth header
  const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  // Fetch posts
  const fetchPosts = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response: AxiosResponse<Post[]> = await api.get('/posts');
      setPosts(response.data);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setError(error.response?.data?.message || error.message || 'Failed to fetch posts');
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPosts();
    
    // Polling for real-time updates (every 10 seconds)
    const interval = setInterval(fetchPosts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Create post
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const response: AxiosResponse<Post> = await api.post('/posts', { content: newPost });
      setPosts([response.data, ...posts]);
      setNewPost('');
      setError(null);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setError(error.response?.data?.message || error.message || 'Failed to create post');
    }
  };

  // Update post
  const handleUpdate = async (postId: string, newContent: string): Promise<void> => {
    if (!newContent.trim()) return;

    try {
      const response: AxiosResponse<Post> = await api.put(`/posts/${postId}`, { content: newContent });
      setPosts(posts.map(post => 
        post._id === postId ? response.data : post
      ));
      setError(null);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setError(error.response?.data?.message || error.message || 'Failed to update post');
    }
  };

  // Delete post
  const handleDelete = async (postId: string): Promise<void> => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(posts.filter(post => post._id !== postId));
      setError(null);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setError(error.response?.data?.message || error.message || 'Failed to delete post');
    }
  };

  // Toggle like on post
  const toggleLike = async (postId: string): Promise<void> => {
    try {
      const response: AxiosResponse<Post> = await api.post(`/posts/${postId}/like`);
      setPosts(posts.map(post => 
        post._id === postId ? response.data : post
      ));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full mb-4"></div>
          <p className="text-gray-600">Loading community posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-6 max-w-md bg-white rounded-xl shadow-md">
          <div className="text-red-500 font-medium mb-2">Error loading community wall</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={fetchPosts}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating action button for mobile */}
      <div className="fixed bottom-6 right-6 z-10 md:hidden">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-600 transition-transform hover:scale-105"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Community Wall</h1>
            <p className="text-gray-500">Share your thoughts and connect with others</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="text-blue-500" size={20} />
            </div>
            <span className="font-medium text-gray-700">{userName}</span>
          </div>
        </div>

        {/* Post form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
          <form onSubmit={handleSubmit}>
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="What's on your mind? Share with the community..."
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none text-gray-800 placeholder-gray-400 transition-all"
                  rows={3}
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs ${newPost.length > 900 ? 'text-red-500' : 'text-gray-400'}`}>
                    {newPost.length}/1000
                  </span>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${newPost.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    disabled={!newPost.trim()}
                  >
                    <Plus size={18} />
                    <span>Post</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Posts feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">No posts yet</h3>
              <p className="text-gray-500">Be the first to share something with the community!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div 
                key={post._id} 
                className={`bg-white rounded-xl shadow-sm p-5 border border-gray-100 transition-all hover:shadow-md ${expandedPost === post._id ? 'ring-2 ring-blue-200' : ''}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center text-white font-semibold shadow">
                      {post.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{post.userName}</div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock size={12} className="mr-1" />
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        {post.createdAt !== post.updatedAt && (
                          <span className="ml-2 italic">edited</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {post.userId === userId && (
                    <div className="relative">
                      <button 
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      
                      {expandedPost === post._id && (
                        <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg z-10 border border-gray-200 w-40">
                          <button
                            onClick={() => {
                              const newContent = prompt('Edit your post:', post.content);
                              if (newContent !== null) {
                                handleUpdate(post._id, newContent);
                                setExpandedPost(null);
                              }
                            }}
                            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center"
                          >
                            <Edit size={16} className="mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this post?')) {
                                handleDelete(post._id);
                                setExpandedPost(null);
                              }
                            }}
                            className="w-full px-4 py-2 text-left text-red-500 hover:bg-gray-50 flex items-center"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="pl-13"> {/* Offset to align with username */}
                  <p className="text-gray-700 whitespace-pre-line break-words mb-4">
                    {post.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityWall;