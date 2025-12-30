import { 
  InboxIcon, 
  ChatBubbleLeftRightIcon, 
  UsersIcon,
  DocumentTextIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  title = 'Nothing here yet',
  message = 'No items to display.',
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-dark-700 mb-4">
        {icon || <InboxIcon className="h-8 w-8 text-gray-500" />}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm max-w-md mb-6">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900"
        >
          <PlusIcon className="h-4 w-4" />
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
}

// Common empty state variants
export function NoPostsEmpty({ onCreatePost }: { onCreatePost?: () => void }) {
  return (
    <EmptyState
      title="No Posts Yet"
      message="Be the first to share something with the community!"
      icon={<DocumentTextIcon className="h-8 w-8 text-gray-500" />}
      action={onCreatePost ? { label: 'Create Post', onClick: onCreatePost } : undefined}
    />
  );
}

export function NoCommentsEmpty() {
  return (
    <EmptyState
      title="No Comments Yet"
      message="Start the conversation by leaving the first comment!"
      icon={<ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-500" />}
    />
  );
}

export function NoMembersEmpty() {
  return (
    <EmptyState
      title="No Members"
      message="This community doesn't have any members yet."
      icon={<UsersIcon className="h-8 w-8 text-gray-500" />}
    />
  );
}

export function NoMessagesEmpty({ onStartChat }: { onStartChat?: () => void }) {
  return (
    <EmptyState
      title="No Messages"
      message="You haven't started any conversations yet."
      icon={<ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-500" />}
      action={onStartChat ? { label: 'Start Chat', onClick: onStartChat } : undefined}
    />
  );
}

export function NoFriendsEmpty({ onAddFriend }: { onAddFriend?: () => void }) {
  return (
    <EmptyState
      title="No Friends Yet"
      message="Connect with others by adding friends."
      icon={<UsersIcon className="h-8 w-8 text-gray-500" />}
      action={onAddFriend ? { label: 'Add Friends', onClick: onAddFriend } : undefined}
    />
  );
}

export function SearchNoResults({ query }: { query?: string }) {
  return (
    <EmptyState
      title="No Results Found"
      message={query ? `No results found for "${query}". Try a different search term.` : 'Try a different search term.'}
      icon={<InboxIcon className="h-8 w-8 text-gray-500" />}
    />
  );
}
