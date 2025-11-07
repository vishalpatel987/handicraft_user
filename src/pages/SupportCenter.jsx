import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Ticket, 
  Send, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle,
  Search,
  Filter,
  Plus,
  Eye,
  Calendar,
  Star,
  ChevronRight,
  ChevronDown,
  X,
  Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { supportAPI } from '../services/api';
import SEO from '../components/SEO/SEO';
import env from '../config/env';

function toIST(dateString) {
  return new Date(dateString).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

const SupportCenter = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState('submit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);

  // Auto-hide success and error messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000); // Hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000); // Hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Close mobile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileDropdownOpen && !event.target.closest('.mobile-dropdown')) {
        setIsMobileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileDropdownOpen]);

  // Form states
  const [queryForm, setQueryForm] = useState({
    subject: '',
    message: '',
    category: 'general',
    priority: 'medium'
  });

  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });

  // User's support history
  const [userQueries, setUserQueries] = useState([]);
  const [userTickets, setUserTickets] = useState([]);
  const [filteredUserQueries, setFilteredUserQueries] = useState([]);
  const [filteredUserTickets, setFilteredUserTickets] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [queryResponse, setQueryResponse] = useState('');
  const [ticketResponse, setTicketResponse] = useState('');
  const [submittingQueryResponse, setSubmittingQueryResponse] = useState(false);
  const [submittingTicketResponse, setSubmittingTicketResponse] = useState(false);

  // History filters
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState('all');
  const [historyPriorityFilter, setHistoryPriorityFilter] = useState('all');


  // FAQ state
  const [faqItems, setFaqItems] = useState([
    {
      id: 1,
      question: "How can I track my order?",
      answer: "You can track your order by visiting the 'My Orders' section in your account or by using the order tracking link sent to your email.",
      category: "order"
    },
    {
      id: 2,
      question: "What is your return policy?",
      answer: "We offer a 7-day return policy for most products. Items must be in original condition with tags attached. Some items like jewelry may have different return terms.",
      category: "return"
    },
    {
      id: 3,
      question: "How long does shipping take?",
      answer: "Standard shipping takes 5-7 business days within India. Express shipping takes 2-3 business days. International shipping takes 10-15 business days.",
      category: "shipping"
    },
    {
      id: 4,
      question: "What payment methods do you accept?",
      answer: "We accept all major credit/debit cards, UPI, net banking, wallets, and Cash on Delivery (COD) for orders within India.",
      category: "payment"
    },
    {
      id: 5,
      question: "How can I cancel my order?",
      answer: "You can cancel your order within 24 hours of placing it if it hasn't been shipped yet. Visit 'My Orders' and click the cancel button.",
      category: "order"
    },
    {
      id: 6,
      question: "Do you ship internationally?",
      answer: "Yes, we ship to most countries worldwide. International shipping charges and delivery times vary by destination.",
      category: "shipping"
    }
  ]);

  const [expandedFaq, setExpandedFaq] = useState(null);
  const [faqSearchTerm, setFaqSearchTerm] = useState('');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('all');

  useEffect(() => {
    if (user) {
      console.log('User data in SupportCenter:', user);
      console.log('Token from localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing');
      fetchUserSupportHistory();
    } else {
      console.log('No user data available in SupportCenter');
      console.log('Token from localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing');
    }
  }, [user]);

  // Join user-specific socket room for status updates
  useEffect(() => {
    if (socket && user?.id) {
      const userId = user.id;
      const roomName = `user_${userId}`;
      
      console.log('Joining user room for status updates:', roomName);
      socket.emit('join_room', { roomId: roomName, userId: userId, userType: 'user' });
      
      return () => {
        console.log('Leaving user room:', roomName);
        socket.emit('leave_room', { roomId: roomName, userId: userId });
      };
    }
  }, [socket, user]);

  // Apply filters to user support history
  useEffect(() => {
    applyHistoryFilters();
  }, [userQueries, userTickets, historySearchTerm, historyStatusFilter, historyCategoryFilter, historyPriorityFilter]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) {
      console.log('No socket available for support center');
      return;
    }
    
    console.log('Setting up socket event listeners for support center');







    // Handle query status updates from admin
    const handleQueryStatusUpdate = (data) => {
      console.log('Query status updated:', data);
      if (data.userId === user?.id) {
        setUserQueries(prev => prev.map(query => 
          query._id === data.queryId 
            ? { ...query, status: data.status }
            : query
        ));
        setSuccess(`Your query status updated to: ${data.status}`);
      }
    };

    // Handle ticket status updates from admin
    const handleTicketStatusUpdate = (data) => {
      console.log('Ticket status updated:', data);
      if (data.userId === user?.id) {
        setUserTickets(prev => prev.map(ticket => 
          ticket._id === data.ticketId 
            ? { ...ticket, status: data.status }
            : ticket
        ));
        setSuccess(`Your ticket status updated to: ${data.status}`);
      }
    };

    // Handle new query response from admin
    const handleQueryResponseAdded = (data) => {
      console.log('Query response added:', data);
      if (data.userId === user?.id) {
        setUserQueries(prev => prev.map(query => {
          if (query._id === data.queryId) {
            // Check if response already exists to prevent duplicates
            const responseExists = query.responses?.some(resp => 
              resp.message === data.response.message && 
              resp.sender === data.response.sender &&
              Math.abs(new Date(resp.createdAt) - new Date(data.response.createdAt)) < 5000
            );
            
            if (!responseExists) {
              return { 
                ...query, 
                responses: [...(query.responses || []), data.response]
              };
            }
          }
          return query;
        }));
        
        // Update selected query if it's the same
        if (selectedQuery && selectedQuery._id === data.queryId) {
          setSelectedQuery(prev => {
            // Check if response already exists to prevent duplicates
            const responseExists = prev.responses?.some(resp => 
              resp.message === data.response.message && 
              resp.sender === data.response.sender &&
              Math.abs(new Date(resp.createdAt) - new Date(data.response.createdAt)) < 5000
            );
            
            if (!responseExists) {
              return {
                ...prev,
                responses: [...(prev.responses || []), data.response]
              };
          }
          return prev;
        });
        }
        
        // Only show success message for admin responses (not user's own)
        if (data.response.sender === 'admin') {
          setSuccess(`New response received for your query!`);
        }
      }
    };

    // Handle new ticket message from admin
    const handleTicketMessageAdded = (data) => {
      console.log('Ticket message added:', data);
      if (data.userId === user?.id) {
        setUserTickets(prev => prev.map(ticket => {
          if (ticket._id === data.ticketId) {
            // Check if message already exists to prevent duplicates
            const messageExists = ticket.messages?.some(msg => 
              msg.message === data.message.message && 
              msg.sender === data.message.sender &&
              Math.abs(new Date(msg.createdAt) - new Date(data.message.createdAt)) < 2000
            );
            
            if (!messageExists) {
              return { 
                ...ticket, 
                messages: [...(ticket.messages || []), data.message]
              };
            }
          }
          return ticket;
        }));
        
        // Update selected ticket if it's the same
        if (selectedTicket && selectedTicket._id === data.ticketId) {
          setSelectedTicket(prev => {
            // Check if message already exists to prevent duplicates
            const messageExists = prev.messages?.some(msg => 
              msg.message === data.message.message && 
              msg.sender === data.message.sender &&
              Math.abs(new Date(msg.createdAt) - new Date(data.message.createdAt)) < 2000
            );
            
            if (!messageExists) {
              return {
                ...prev,
                messages: [...(prev.messages || []), data.message]
              };
            }
            return prev;
          });
        }
        
        // Only show success message for admin messages (not user's own)
        if (data.message.sender === 'admin') {
          setSuccess(`New message received for your ticket!`);
        }
      }
    };

    socket.on('query_status_updated', handleQueryStatusUpdate);
    socket.on('ticket_status_updated', handleTicketStatusUpdate);
    socket.on('query_response_added', handleQueryResponseAdded);
    socket.on('ticket_message_added', handleTicketMessageAdded);

    return () => {
      socket.off('query_status_updated', handleQueryStatusUpdate);
      socket.off('ticket_status_updated', handleTicketStatusUpdate);
      socket.off('query_response_added', handleQueryResponseAdded);
      socket.off('ticket_message_added', handleTicketMessageAdded);
    };
  }, [socket, user]);

  const fetchUserSupportHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch user's support queries
      const queriesResponse = await supportAPI.getSupportQueries({ userId: user.id });
      if (queriesResponse.data.success) {
        setUserQueries(queriesResponse.data.queries || []);
      }

      // Fetch user's support tickets
      const ticketsResponse = await supportAPI.getSupportTickets({ userId: user.id });
      if (ticketsResponse.data.success) {
        setUserTickets(ticketsResponse.data.tickets || []);
      }
    } catch (err) {
      console.error('Error fetching support history:', err);
      setError('Failed to load support history');
    } finally {
      setLoading(false);
    }
  };

  const applyHistoryFilters = () => {
    // Filter queries
    const filteredQueries = userQueries.filter(query => {
      const matchesSearch = !historySearchTerm || 
        query.subject.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        query.message.toLowerCase().includes(historySearchTerm.toLowerCase());
      
      const matchesStatus = historyStatusFilter === 'all' || query.status === historyStatusFilter;
      const matchesCategory = historyCategoryFilter === 'all' || query.category === historyCategoryFilter;
      const matchesPriority = historyPriorityFilter === 'all' || query.priority === historyPriorityFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
    setFilteredUserQueries(filteredQueries);

    // Filter tickets
    const filteredTickets = userTickets.filter(ticket => {
      const matchesSearch = !historySearchTerm || 
        ticket.title.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        ticket.ticketNumber.toLowerCase().includes(historySearchTerm.toLowerCase());
      
      const matchesStatus = historyStatusFilter === 'all' || ticket.status === historyStatusFilter;
      const matchesCategory = historyCategoryFilter === 'all' || ticket.category === historyCategoryFilter;
      const matchesPriority = historyPriorityFilter === 'all' || ticket.priority === historyPriorityFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
    setFilteredUserTickets(filteredTickets);
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!queryForm.subject.trim() || !queryForm.message.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queryData = {
        customerName: user?.name || 'Guest User',
        customerEmail: user?.email || '',
        customerPhone: user?.phone || '',
        userId: user?.id || null,
        subject: queryForm.subject,
        message: queryForm.message,
        category: queryForm.category,
        priority: queryForm.priority
      };

      const response = await supportAPI.submitSupportQuery(queryData);

      if (response.data.success) {
        setSuccess('Your query has been submitted successfully. We will respond within 24 hours.');
        setQueryForm({
          subject: '',
          message: '',
          category: 'general',
          priority: 'medium'
        });
        setActiveTab('history');
        // Add new query to user queries list without full refresh
        setUserQueries(prev => [response.data.query, ...prev]);
      }
    } catch (err) {
      console.error('Error submitting query:', err);
      setError('Failed to submit query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketForm.title.trim() || !ticketForm.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const ticketData = {
        title: ticketForm.title,
        description: ticketForm.description,
        customerName: user?.name || 'Guest User',
        customerEmail: user?.email || '',
        customerPhone: user?.phone || '',
        userId: user?.id || null,
        category: ticketForm.category,
        priority: ticketForm.priority
      };

      const response = await supportAPI.submitSupportTicket(ticketData);

      if (response.data.success) {
        setSuccess(`Your support ticket has been created successfully. Ticket Number: ${response.data.ticket.ticketNumber}`);
        setTicketForm({
          title: '',
          description: '',
          category: 'general',
          priority: 'medium'
        });
        setActiveTab('history');
        // Add new ticket to user tickets list without full refresh
        setUserTickets(prev => [response.data.ticket, ...prev]);
      }
    } catch (err) {
      console.error('Error submitting ticket:', err);
      setError('Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle user response to admin query
  const handleUserQueryResponse = async () => {
    if (!queryResponse.trim() || !selectedQuery) return;

    try {
      setSubmittingQueryResponse(true);
      
      // Store message content before clearing
      const messageContent = queryResponse;
      const responseData = {
        message: messageContent,
        sender: 'customer',
        senderName: user?.name || 'Customer',
        senderEmail: user?.email || '',
        createdAt: new Date()
      };

      const response = await supportAPI.addQueryResponse(selectedQuery._id, responseData);

      if (response.data.success) {
        setSuccess('Your response has been sent successfully');
        setQueryResponse('');
        
        // Update local state immediately for better UX
        setSelectedQuery(prev => ({
        ...prev,
          responses: [...(prev.responses || []), responseData]
        }));
        
        setUserQueries(prev => prev.map(query => 
          query._id === selectedQuery._id 
            ? { ...query, responses: [...(query.responses || []), responseData] }
            : query
        ));
      }
    } catch (err) {
      console.error('Error sending response:', err);
      setError('Failed to send response');
    } finally {
      setSubmittingQueryResponse(false);
    }
  };

  // Handle user response to admin ticket
  const handleUserTicketResponse = async () => {
    if (!ticketResponse.trim() || !selectedTicket) return;

    try {
      setSubmittingTicketResponse(true);
      
      // Store message content before clearing
      const messageContent = ticketResponse;
      const responseData = {
        message: messageContent,
        sender: 'customer',
        senderName: user?.name || 'Customer',
        senderEmail: user?.email || '',
        createdAt: new Date()
      };

      const response = await supportAPI.addTicketMessage(selectedTicket._id, responseData);

      if (response.data.success) {
        setSuccess('Your response has been sent successfully');
        setTicketResponse('');
        
        // Update local state immediately for better UX
        setSelectedTicket(prev => ({
          ...prev,
          messages: [...(prev.messages || []), responseData]
        }));
        
        setUserTickets(prev => prev.map(ticket => 
          ticket._id === selectedTicket._id 
            ? { ...ticket, messages: [...(ticket.messages || []), responseData] }
            : ticket
        ));
      }
    } catch (err) {
      console.error('Error sending response:', err);
      setError('Failed to send response');
    } finally {
      setSubmittingTicketResponse(false);
    }
  };




  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredFaqs = faqItems.filter(faq => {
    const matchesSearch = !faqSearchTerm || 
      faq.question.toLowerCase().includes(faqSearchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearchTerm.toLowerCase());
    const matchesCategory = faqCategoryFilter === 'all' || faq.category === faqCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Support Center - Rikocraft Customer Support"
        description="Get help with your orders, returns, shipping, and more. Contact Rikocraft customer support for assistance."
        keywords="customer support, help, contact, Rikocraft support, order help"
        url={`${env.FRONTEND_URL}/support`}
        image="/logo.png"
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-[#772a4b] to-[#8f3a61] text-white py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">Support Center</h1>
            <p className="text-base md:text-xl opacity-90">We're here to help you with any questions or concerns</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Quick Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-4 md:p-6 text-center hover:shadow-lg transition-shadow"
          >
            <MessageSquare className="h-10 w-10 md:h-12 md:w-12 text-[#772a4b] mx-auto mb-3 md:mb-4" />
            <h3 className="text-lg font-semibold mb-2">Submit a Query</h3>
            <p className="text-gray-600 mb-4">Ask us anything about our products or services</p>
            <button
              onClick={() => setActiveTab('submit')}
              className="bg-[#772a4b] text-white px-4 py-2 rounded-lg hover:bg-[#8f3a61] transition-colors"
            >
              Submit Query
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-4 md:p-6 text-center hover:shadow-lg transition-shadow"
          >
            <Ticket className="h-10 w-10 md:h-12 md:w-12 text-[#8f3a61] mx-auto mb-3 md:mb-4" />
            <h3 className="text-lg font-semibold mb-2">Create Ticket</h3>
            <p className="text-gray-600 mb-4">Report an issue or request assistance</p>
            <button
              onClick={() => setActiveTab('ticket')}
              className="bg-[#8f3a61] text-white px-4 py-2 rounded-lg hover:bg-[#772a4b] transition-colors"
            >
              Create Ticket
            </button>
          </motion.div>

        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            {/* Desktop Tabs */}
            <nav className="hidden md:flex space-x-8 px-6">
              {[
                { id: 'submit', label: 'Submit Query', icon: MessageSquare },
                { id: 'ticket', label: 'Create Ticket', icon: Ticket },
                { id: 'faq', label: 'FAQ', icon: HelpCircle },
                { id: 'history', label: 'My Support', icon: Clock }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-[#772a4b] text-[#772a4b]'
                      : 'border-transparent text-gray-500 hover:text-[#772a4b] hover:border-[#772a4b]'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Mobile Dropdown */}
            <div className="md:hidden mobile-dropdown">
              <button
                onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
                className="w-full flex items-center justify-between px-6 py-4 text-left font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  {(() => {
                    const currentTab = [
                      { id: 'submit', label: 'Submit Query', icon: MessageSquare },
                      { id: 'ticket', label: 'Create Ticket', icon: Ticket },
                      { id: 'faq', label: 'FAQ', icon: HelpCircle },
                      { id: 'history', label: 'My Support', icon: Clock }
                    ].find(tab => tab.id === activeTab);
                    const IconComponent = currentTab?.icon || MessageSquare;
                    return (
                      <>
                        <IconComponent className="h-4 w-4" />
                        {currentTab?.label || 'Submit Query'}
                      </>
                    );
                  })()}
                </div>
                <ChevronDown 
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isMobileDropdownOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isMobileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-200 bg-gray-50"
                  >
                    {[
                      { id: 'submit', label: 'Submit Query', icon: MessageSquare },
                      { id: 'ticket', label: 'Create Ticket', icon: Ticket },
                      { id: 'faq', label: 'FAQ', icon: HelpCircle },
                      { id: 'history', label: 'My Support', icon: Clock }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMobileDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-6 py-3 text-left font-medium text-sm transition-colors ${
                          activeTab === tab.id
                            ? 'bg-[#772a4b] text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {/* Submit Query Tab */}
            {activeTab === 'submit' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-2xl mx-auto"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit a Support Query</h2>
                <form onSubmit={handleQuerySubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={queryForm.subject}
                      onChange={(e) => setQueryForm({ ...queryForm, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#772a4b] focus:border-transparent"
                      placeholder="Brief description of your query"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={queryForm.category}
                        onChange={(e) => setQueryForm({ ...queryForm, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#772a4b] focus:border-transparent"
                      >
                        <option value="general">General</option>
                        <option value="billing">Billing</option>
                        <option value="shipping">Shipping</option>
                        <option value="product">Product</option>
                        <option value="technical">Technical</option>
                        <option value="refund">Refund</option>
                        <option value="order">Order</option>
                        <option value="account">Account</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={queryForm.priority}
                        onChange={(e) => setQueryForm({ ...queryForm, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#772a4b] focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      value={queryForm.message}
                      onChange={(e) => setQueryForm({ ...queryForm, message: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#772a4b] focus:border-transparent"
                      placeholder="Please provide detailed information about your query..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#772a4b] text-white py-3 px-4 rounded-lg hover:bg-[#8f3a61] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit Query
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Create Ticket Tab */}
            {activeTab === 'ticket' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-2xl mx-auto"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Create a Support Ticket</h2>
                <form onSubmit={handleTicketSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={ticketForm.title}
                      onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#772a4b] focus:border-transparent"
                      placeholder="Brief title for your ticket"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={ticketForm.category}
                        onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#772a4b] focus:border-transparent"
                      >
                        <option value="general">General</option>
                        <option value="technical">Technical</option>
                        <option value="billing">Billing</option>
                        <option value="shipping">Shipping</option>
                        <option value="product">Product</option>
                        <option value="account">Account</option>
                        <option value="refund">Refund</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={ticketForm.priority}
                        onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#772a4b] focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#772a4b] focus:border-transparent"
                      placeholder="Please provide detailed information about the issue..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#8f3a61] text-white py-3 px-4 rounded-lg hover:bg-[#772a4b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Ticket className="h-4 w-4" />
                        Create Ticket
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}


            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-4xl mx-auto"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                
                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search FAQs..."
                        value={faqSearchTerm}
                        onChange={(e) => setFaqSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <select
                    value={faqCategoryFilter}
                    onChange={(e) => setFaqCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    <option value="order">Order</option>
                    <option value="shipping">Shipping</option>
                    <option value="return">Return</option>
                    <option value="payment">Payment</option>
                  </select>
                </div>

                {/* FAQ Items */}
                <div className="space-y-4">
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} className="bg-white border border-gray-200 rounded-lg">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{faq.question}</span>
                        {expandedFaq === faq.id ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedFaq === faq.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-4 text-gray-600">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {filteredFaqs.length === 0 && (
                  <div className="text-center py-8">
                    <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No FAQs found matching your search.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* My Support Tab */}
            {activeTab === 'history' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-4xl mx-auto"
              >
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">My Support History</h2>
                
                {user ? (
                  <div className="space-y-4 md:space-y-6">
                    {/* Filters */}
                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Filters</h3>
                      <div className="flex flex-col gap-4">
                        <div className="w-full">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search queries and tickets..."
                              value={historySearchTerm}
                              onChange={(e) => setHistorySearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#772a4b] focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 md:gap-2">
                          <select
                            value={historyStatusFilter}
                            onChange={(e) => setHistoryStatusFilter(e.target.value)}
                            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#772a4b] focus:border-transparent"
                          >
                            <option value="all">All Status</option>
                            <option value="open">Open</option>
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="waiting_customer">Waiting Customer</option>
                            <option value="pending_customer">Pending Customer</option>
                            <option value="pending_admin">Pending Admin</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                          <select
                            value={historyCategoryFilter}
                            onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#772a4b] focus:border-transparent"
                          >
                            <option value="all">All Categories</option>
                            <option value="general">General</option>
                            <option value="billing">Billing</option>
                            <option value="shipping">Shipping</option>
                            <option value="product">Product</option>
                            <option value="technical">Technical</option>
                            <option value="refund">Refund</option>
                            <option value="order">Order</option>
                            <option value="account">Account</option>
                            <option value="other">Other</option>
                          </select>
                          <select
                            value={historyPriorityFilter}
                            onChange={(e) => setHistoryPriorityFilter(e.target.value)}
                            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#772a4b] focus:border-transparent"
                          >
                            <option value="all">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Queries Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Support Queries ({filteredUserQueries.length})
                      </h3>
                      {filteredUserQueries.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-6 text-center">
                          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">
                            {userQueries.length === 0 ? 'No support queries found.' : 'No queries match your filters.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredUserQueries.map((query) => (
                            <div key={query._id} className="bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{query.subject}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(query.status)}`}>
                                      {query.status}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(query.priority)}`}>
                                      {query.priority}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-2">{query.message}</p>
                                  <p className="text-xs text-gray-500 mt-2">{toIST(query.createdAt)}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedQuery(query);
                                    setShowQueryModal(true);
                                  }}
                                  className="ml-4 text-[#772a4b] hover:text-[#8f3a61]"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tickets Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Support Tickets ({filteredUserTickets.length})
                      </h3>
                      {filteredUserTickets.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-6 text-center">
                          <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">
                            {userTickets.length === 0 ? 'No support tickets found.' : 'No tickets match your filters.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredUserTickets.map((ticket) => (
                            <div key={ticket._id} className="bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{ticket.title}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-gray-500">#{ticket.ticketNumber}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                      {ticket.status}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                      {ticket.priority}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-2">{ticket.description}</p>
                                  <p className="text-xs text-gray-500 mt-2">{toIST(ticket.createdAt)}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setShowTicketModal(true);
                                  }}
                                  className="ml-4 text-[#772a4b] hover:text-[#8f3a61]"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Please log in to view your support history.</p>
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="bg-[#772a4b] text-white px-4 py-2 rounded-lg hover:bg-[#8f3a61] transition-colors"
                    >
                      Login
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>


      {/* Query Details Modal */}
      <AnimatePresence>
        {showQueryModal && selectedQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Query Details</h2>
                  <button
                    onClick={() => setShowQueryModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedQuery.subject}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedQuery.status)}`}>
                        {selectedQuery.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedQuery.priority)}`}>
                        {selectedQuery.priority}
                      </span>
                  </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">Your Message</span>
                    </div>
                    <p className="text-gray-700">{selectedQuery.message}</p>
                    <p className="text-xs text-gray-500 mt-2">{toIST(selectedQuery.createdAt)}</p>
                  </div>

                  {selectedQuery.responses && selectedQuery.responses.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Admin Responses</h4>
                      {selectedQuery.responses.map((response, index) => (
                        <div key={index} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{response.senderName}</span>
                            <span className="text-xs text-gray-500">({response.sender})</span>
                            <span className="text-xs text-gray-500">{toIST(response.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 text-sm">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!selectedQuery.responses || selectedQuery.responses.length === 0) && (
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">Waiting for admin response...</span>
                      </div>
                    </div>
                  )}

                  {/* User Response Input */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-gray-900 mb-3">Reply to Admin</h4>
                    <div className="space-y-3">
                      <textarea
                        value={queryResponse}
                        onChange={(e) => setQueryResponse(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Type your response to admin here..."
                      />
                      <div className="flex justify-end gap-3">
                  <button
                          onClick={() => setShowQueryModal(false)}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Close
                        </button>
                        <button
                          onClick={handleUserQueryResponse}
                          disabled={!queryResponse.trim() || submittingQueryResponse}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {submittingQueryResponse ? 'Sending...' : 'Send Response'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket Details Modal */}
      <AnimatePresence>
        {showTicketModal && selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Ticket Details</h2>
                  <button
                    onClick={() => setShowTicketModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
              </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedTicket.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">#{selectedTicket.ticketNumber}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">Your Description</span>
                </div>
                    <p className="text-gray-700">{selectedTicket.description}</p>
                    <p className="text-xs text-gray-500 mt-2">{toIST(selectedTicket.createdAt)}</p>
              </div>

                  {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Messages</h4>
                      {selectedTicket.messages.map((message, index) => (
                        <div key={index} className={`p-3 rounded-lg ${
                          message.sender === 'admin' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50 border-l-4 border-gray-400'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{message.senderName}</span>
                            <span className="text-xs text-gray-500">({message.sender})</span>
                            <span className="text-xs text-gray-500">{toIST(message.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 text-sm">{message.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">Waiting for admin response...</span>
                      </div>
                    </div>
                  )}

                  {/* User Response Input */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-gray-900 mb-3">Reply to Admin</h4>
                    <div className="space-y-3">
                      <textarea
                        value={ticketResponse}
                        onChange={(e) => setTicketResponse(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Type your response to admin here..."
                      />
                      <div className="flex justify-end gap-3">
                  <button
                          onClick={() => setShowTicketModal(false)}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Close
                        </button>
                        <button
                          onClick={handleUserTicketResponse}
                          disabled={!ticketResponse.trim() || submittingTicketResponse}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {submittingTicketResponse ? 'Sending...' : 'Send Response'}
                  </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {success}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportCenter;
