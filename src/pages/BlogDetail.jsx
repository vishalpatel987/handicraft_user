import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Eye, Tag, ArrowLeft, Share2 } from 'lucide-react';
import blogService from '../services/blogService';
import { format } from 'date-fns';
import SEO from '../components/SEO/SEO';
import env from '../config/env';

const BlogDetail = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlog();
    fetchRecentBlogs();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await blogService.getBlogBySlug(slug);
      setBlog(response.blog);
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentBlogs = async () => {
    try {
      const response = await blogService.getRecentBlogs(3);
      setRecentBlogs(response.blogs || []);
    } catch (error) {
      console.error('Error fetching recent blogs:', error);
    }
  };

  const getImageUrl = (imgPath) => {
    if (!imgPath) return '/placeholder.png';
    if (imgPath.startsWith('http')) return imgPath;
    return `${env.API_BASE_URL}${imgPath}`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Blog not found</h2>
          <Link to="/blogs" className="text-blue-600 hover:underline">Back to Blogs</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={`${blog.title} - RikoCraft Blog`}
        description={blog.excerpt}
        url={`${env.FRONTEND_URL}/blogs/${blog.slug}`}
        image={getImageUrl(blog.featuredImage)}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Blogs
          </Link>

          {/* Blog Content */}
          <article className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Featured Image */}
            <div className="relative h-96">
              <img
                src={getImageUrl(blog.featuredImage)}
                alt={blog.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = '/placeholder.png'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full mb-4 inline-block">
                  {blog.category}
                </span>
                <h1 className="text-4xl font-bold text-white mb-4">{blog.title}</h1>
                <div className="flex items-center gap-6 text-white/90">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>{format(new Date(blog.publishedAt), 'dd MMMM yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    <span>{blog.views} views</span>
                  </div>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="prose prose-lg max-w-none">
                <div dangerouslySetInnerHTML={{ __html: blog.content }} />
              </div>

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag className="w-5 h-5 text-gray-400" />
                    {blog.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>

          {/* Recent Blogs */}
          {recentBlogs.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentBlogs.map((recentBlog) => (
                  <Link
                    key={recentBlog._id}
                    to={`/blogs/${recentBlog.slug}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <img
                      src={getImageUrl(recentBlog.featuredImage)}
                      alt={recentBlog.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => { e.target.src = '/placeholder.png'; }}
                    />
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                        {recentBlog.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{recentBlog.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogDetail;

