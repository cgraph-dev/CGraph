/**
 * Individual call history item component.
 * @module
 */
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDuration, formatTimestamp } from './hooks';
import { itemVariants } from './animations';
import type { CallRecord } from './types';

interface CallItemProps {
  call: CallRecord;
  onDelete: (id: string) => void;
}

const directionConfig = {
  incoming: { icon: PhoneIncoming, color: 'text-emerald-400', label: 'Incoming' },
  outgoing: { icon: PhoneOutgoing, color: 'text-blue-400', label: 'Outgoing' },
  missed: { icon: PhoneMissed, color: 'text-red-400', label: 'Missed' },
} as const;

/**
 * Call Item component.
 */
export default function CallItem({ call, onDelete }: CallItemProps) {
  const navigate = useNavigate();
  const dir = directionConfig[call.direction];
  const DirIcon = dir.icon;

  const handleCallBack = () => {
    navigate(`/call/${call.recipientId}/${call.type}`);
  };

  return (
    <motion.div
      variants={itemVariants}
      layout
      className="flex items-center gap-4 rounded-lg bg-dark-800/50 p-3 transition-colors hover:bg-dark-700/50"
    >
      {/* Avatar */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-dark-700">
        <span className="text-lg font-semibold text-white/80">{call.recipientName.charAt(0)}</span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span
            className={`truncate text-sm font-semibold ${
              call.direction === 'missed' ? 'text-red-400' : 'text-white'
            }`}
          >
            {call.recipientName}
          </span>
          <span className="shrink-0 text-xs text-white/40">{formatTimestamp(call.timestamp)}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <DirIcon className={`h-3.5 w-3.5 ${dir.color}`} />
          {call.type === 'video' ? (
            <Video className="h-3.5 w-3.5 text-white/40" />
          ) : (
            <Phone className="h-3.5 w-3.5 text-white/40" />
          )}
          <span className="text-xs text-white/50">{formatDuration(call.duration)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleCallBack}
          className="rounded-full p-2 text-emerald-400 transition-colors hover:bg-dark-600"
          title={`Call ${call.recipientName}`}
        >
          {call.type === 'video' ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => onDelete(call.id)}
          className="rounded-full p-2 text-white/30 transition-colors hover:bg-red-500/20 hover:text-red-400"
          title="Delete call"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
