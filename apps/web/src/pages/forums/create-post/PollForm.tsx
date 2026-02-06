/**
 * PollForm Component - Poll creation form with dynamic option management
 * @module pages/forums/create-post
 */
import { XMarkIcon } from '@heroicons/react/24/outline';

interface PollFormProps {
  pollQuestion: string;
  setPollQuestion: (value: string) => void;
  pollOptions: string[];
  setPollOptions: (options: string[]) => void;
  pollAllowMultiple: boolean;
  setPollAllowMultiple: (value: boolean) => void;
  pollPublic: boolean;
  setPollPublic: (value: boolean) => void;
}

export default function PollForm({
  pollQuestion,
  setPollQuestion,
  pollOptions,
  setPollOptions,
  pollAllowMultiple,
  setPollAllowMultiple,
  pollPublic,
  setPollPublic,
}: PollFormProps) {
  return (
    <div className="space-y-4">
      {/* Poll Question */}
      <div>
        <input
          type="text"
          placeholder="Poll Question"
          value={pollQuestion}
          onChange={(e) => setPollQuestion(e.target.value)}
          className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
      </div>

      {/* Poll Options */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Poll Options</label>
        {pollOptions.map((option, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => {
                const newOptions = [...pollOptions];
                newOptions[index] = e.target.value;
                setPollOptions(newOptions);
              }}
              className="flex-1 rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            {pollOptions.length > 2 && (
              <button
                type="button"
                onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                className="rounded-lg border border-red-500 bg-red-500/20 px-3 py-2 text-red-400 transition-colors hover:bg-red-500/30"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setPollOptions([...pollOptions, ''])}
          className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-gray-300 transition-colors hover:bg-dark-600"
        >
          + Add Option
        </button>
      </div>

      {/* Poll Settings */}
      <div className="space-y-3 rounded-lg border border-dark-700 bg-dark-800/50 p-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={pollAllowMultiple}
            onChange={(e) => setPollAllowMultiple(e.target.checked)}
            className="h-4 w-4 rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-300">Allow multiple selections</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={pollPublic}
            onChange={(e) => setPollPublic(e.target.checked)}
            className="h-4 w-4 rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-300">Public poll (show who voted)</span>
        </label>
      </div>
    </div>
  );
}
