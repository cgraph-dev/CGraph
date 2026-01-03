import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForumStore } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { forumLogger as logger } from '@/lib/logger';
import {
  SparklesIcon,
  PhotoIcon,
  PaintBrushIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

/**
 * CreateForum - Multi-step wizard for creating a MyBB-style forum
 * 
 * Features:
 * - Step 1: Basic Info (name, slug, description)
 * - Step 2: Appearance (icon, banner, colors)
 * - Step 3: Settings (privacy, posting rules)
 * - Step 4: Confirmation
 * 
 * Tier Limits:
 * - Free: 1 forum
 * - Starter ($5/mo): 3 forums
 * - Pro ($15/mo): 10 forums
 * - Business ($50/mo): Unlimited
 */
export default function CreateForum() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { createForum } = useForumStore();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    slug: '',
    description: '',
    category: 'other',
    
    // Appearance
    iconUrl: '',
    bannerUrl: '',
    primaryColor: '#1a73e8',
    
    // Settings
    isPublic: true,
    isNsfw: false,
    allowPosts: true,
    registrationOpen: true,
  });

  const categories = [
    { value: 'gaming', label: 'Gaming' },
    { value: 'technology', label: 'Technology' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'sports', label: 'Sports' },
    { value: 'music', label: 'Music' },
    { value: 'art', label: 'Art & Design' },
    { value: 'education', label: 'Education' },
    { value: 'business', label: 'Business' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'other', label: 'Other' },
  ];

  // Auto-generate slug from name (forum names can only contain letters, numbers, underscores)
  const handleNameChange = (inputName: string) => {
    // Sanitize name: only allow letters, numbers, underscores - remove spaces and special chars
    const sanitizedName = inputName.replace(/[^a-zA-Z0-9_]/g, '');
    const slug = sanitizedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
    
    setFormData({ ...formData, name: sanitizedName, slug });
  };

  // Validate form data before submission
  const validateForm = (): string | null => {
    if (!formData.name || formData.name.length < 3) {
      return 'Forum name must be at least 3 characters long';
    }
    if (formData.name.length > 21) {
      return 'Forum name must be at most 21 characters long';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.name)) {
      return 'Forum name can only contain letters, numbers, and underscores';
    }
    if (!formData.slug) {
      return 'Forum URL slug is required';
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setError('You must be logged in to create a forum');
      return;
    }

    // Validate before submission
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      logger.log('[CreateForum] Submitting:', {
        name: formData.name,
        description: formData.description,
        isNsfw: formData.isNsfw,
        isPrivate: !formData.isPublic,
      });

      const forum = await createForum({
        name: formData.name,
        description: formData.description,
        isNsfw: formData.isNsfw,
        isPrivate: !formData.isPublic,
      });

      logger.log('[CreateForum] Success:', forum);

      // Navigate to the new forum
      navigate(`/forums/${forum.slug}`);
    } catch (err: unknown) {
      logger.error('[CreateForum] Error:', err);
      const errorObj = err as { 
        response?: { 
          data?: { 
            error?: string | { 
              message?: string;
              details?: Record<string, string[]>;
              code?: string;
            };
            message?: string;
          } 
        };
        message?: string;
      };
      
      // Handle various error formats from backend
      let message = 'Failed to create forum. Please try again.';
      
      const errorData = errorObj.response?.data?.error;
      
      if (typeof errorData === 'string') {
        // Simple string error: { error: "Unauthorized" }
        message = errorData;
        if (errorObj.response?.data?.message) {
          message += `: ${errorObj.response.data.message}`;
        }
      } else if (errorData && typeof errorData === 'object') {
        // Object error: { error: { message, details } }
        if (errorData.message) {
          message = errorData.message;
        }
        
        // If there are details (Ecto changeset validation errors), append them
        if (errorData.details && typeof errorData.details === 'object') {
          const detailMessages = Object.entries(errorData.details)
            .map(([field, msgs]) => {
              const fieldName = field.replace(/_/g, ' ');
              const msgArray = Array.isArray(msgs) ? msgs : [String(msgs)];
              return `${fieldName}: ${msgArray.join(', ')}`;
            })
            .join('; ');
          
          if (detailMessages) {
            message = detailMessages;
          }
        }
      } else if (errorObj.response?.data?.message) {
        message = errorObj.response.data.message;
      } else if (errorObj.message) {
        message = errorObj.message;
      }
      
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-gray-400 mb-4">You need to be logged in to create a forum.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <SparklesIcon className="h-10 w-10 text-white" />
            <h1 className="text-3xl font-bold text-white">Create Your Forum</h1>
          </div>
          <p className="text-primary-100">
            Build your own MyBB-style community with boards, threads, and full customization.
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-dark-800 border-b border-dark-700">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Basic Info', icon: ChatBubbleLeftRightIcon },
              { num: 2, label: 'Appearance', icon: PaintBrushIcon },
              { num: 3, label: 'Settings', icon: CogIcon },
              { num: 4, label: 'Confirm', icon: CheckCircleIcon },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                    step === s.num
                      ? 'bg-primary-600 text-white'
                      : step > s.num
                      ? 'bg-green-600 text-white'
                      : 'bg-dark-700 text-gray-400'
                  }`}
                >
                  <s.icon className="h-5 w-5" />
                  <span className="hidden sm:inline font-medium">{s.label}</span>
                </div>
                {i < 3 && (
                  <div className={`w-8 h-0.5 mx-2 ${step > s.num ? 'bg-green-600' : 'bg-dark-600'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
              Basic Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Forum Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="MyAwesomeForum"
                className={`w-full px-4 py-3 bg-dark-700 border rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${
                  formData.name && (formData.name.length < 3 || formData.name.length > 21)
                    ? 'border-red-500'
                    : 'border-dark-600'
                }`}
                maxLength={21}
              />
              <div className="mt-1 flex justify-between">
                <p className="text-sm text-gray-500">
                  3-21 characters. Letters, numbers, underscores only.
                </p>
                <span className={`text-sm ${
                  formData.name.length < 3 ? 'text-red-400' :
                  formData.name.length > 21 ? 'text-red-400' : 'text-gray-500'
                }`}>
                  {formData.name.length}/21
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL Slug *
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">cgraph.com/forums/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="my-awesome-forum"
                  className="flex-1 px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  maxLength={50}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell people what your forum is about..."
                rows={4}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                maxLength={500}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Appearance */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <PaintBrushIcon className="h-6 w-6" />
              Appearance
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Forum Icon URL
              </label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-dark-700 border border-dark-600 flex items-center justify-center overflow-hidden">
                  {formData.iconUrl ? (
                    <img src={formData.iconUrl} alt="Icon preview" className="h-full w-full object-cover" />
                  ) : (
                    <PhotoIcon className="h-8 w-8 text-gray-500" />
                  )}
                </div>
                <input
                  type="url"
                  value={formData.iconUrl}
                  onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                  placeholder="https://example.com/icon.png"
                  className="flex-1 px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Banner Image URL
              </label>
              <div className="mb-3 h-32 rounded-lg bg-dark-700 border border-dark-600 overflow-hidden">
                {formData.bannerUrl ? (
                  <img src={formData.bannerUrl} alt="Banner preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <PhotoIcon className="h-12 w-12 text-gray-500" />
                  </div>
                )}
              </div>
              <input
                type="url"
                value={formData.bannerUrl}
                onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                placeholder="https://example.com/banner.png"
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Primary Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="h-12 w-12 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1 px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Settings */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CogIcon className="h-6 w-6" />
              Forum Settings
            </h2>

            <div className="space-y-4">
              {/* Privacy */}
              <div className="p-4 bg-dark-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {formData.isPublic ? (
                      <GlobeAltIcon className="h-6 w-6 text-green-500" />
                    ) : (
                      <LockClosedIcon className="h-6 w-6 text-yellow-500" />
                    )}
                    <div>
                      <h3 className="font-medium text-white">
                        {formData.isPublic ? 'Public Forum' : 'Private Forum'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {formData.isPublic 
                          ? 'Anyone can view and join your forum'
                          : 'Only approved members can access'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isPublic ? 'bg-green-600' : 'bg-dark-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isPublic ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* NSFW */}
              <div className="p-4 bg-dark-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ExclamationTriangleIcon className={`h-6 w-6 ${formData.isNsfw ? 'text-red-500' : 'text-gray-500'}`} />
                    <div>
                      <h3 className="font-medium text-white">NSFW Content</h3>
                      <p className="text-sm text-gray-400">
                        Mark if forum contains adult content
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, isNsfw: !formData.isNsfw })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isNsfw ? 'bg-red-600' : 'bg-dark-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isNsfw ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Open Registration */}
              <div className="p-4 bg-dark-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UsersIcon className={`h-6 w-6 ${formData.registrationOpen ? 'text-green-500' : 'text-gray-500'}`} />
                    <div>
                      <h3 className="font-medium text-white">Open Registration</h3>
                      <p className="text-sm text-gray-400">
                        Allow anyone to join your forum
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, registrationOpen: !formData.registrationOpen })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.registrationOpen ? 'bg-green-600' : 'bg-dark-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.registrationOpen ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircleIcon className="h-6 w-6" />
              Confirm Your Forum
            </h2>

            <div className="bg-dark-700 rounded-lg overflow-hidden">
              {/* Preview Banner */}
              <div 
                className="h-32"
                style={{ 
                  background: formData.bannerUrl 
                    ? `url(${formData.bannerUrl}) center/cover` 
                    : `linear-gradient(135deg, ${formData.primaryColor}, ${formData.primaryColor}88)`
                }}
              />
              
              {/* Preview Content */}
              <div className="p-6 -mt-8">
                <div className="flex items-start gap-4">
                  <div 
                    className="h-16 w-16 rounded-full border-4 border-dark-700 flex items-center justify-center"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    {formData.iconUrl ? (
                      <img src={formData.iconUrl} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {formData.name?.[0]?.toUpperCase() || 'F'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 pt-6">
                    <h3 className="text-xl font-bold text-white">{formData.name || 'Your Forum'}</h3>
                    <p className="text-sm text-gray-400">f/{formData.slug || 'your-forum'}</p>
                    {formData.description && (
                      <p className="mt-2 text-gray-300">{formData.description}</p>
                    )}
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-dark-600 rounded text-xs text-gray-300">
                        {categories.find(c => c.value === formData.category)?.label || 'Other'}
                      </span>
                      {formData.isPublic ? (
                        <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Public</span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs">Private</span>
                      )}
                      {formData.isNsfw && (
                        <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs">NSFW</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="p-4 bg-primary-600/20 border border-primary-500/30 rounded-lg">
              <h4 className="font-medium text-primary-300 mb-2">Your Subscription</h4>
              <p className="text-sm text-gray-300">
                You're on the <span className="font-bold text-white">{(user as { subscription_tier?: string })?.subscription_tier?.toUpperCase() || 'FREE'}</span> tier.
                {((user as { subscription_tier?: string })?.subscription_tier || 'free') === 'free' && (
                  <span className="block mt-1 text-gray-400">
                    This is your 1 free forum. Upgrade to create more forums with additional features!
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/forums')}
            className="flex items-center gap-2 px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            {step > 1 ? 'Previous' : 'Cancel'}
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && (!formData.name || !formData.slug || formData.name.length < 3 || formData.name.length > 21 || !/^[a-zA-Z0-9_]+$/.test(formData.name))}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  Create Forum
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
