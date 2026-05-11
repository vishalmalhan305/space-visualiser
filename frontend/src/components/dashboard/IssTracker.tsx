import { useState } from 'react';
import { motion } from 'framer-motion';
import { Satellite, RotateCcw } from 'lucide-react';
import { useIssTrail } from '../../hooks/useIssTrail';
import { IssMapCard } from '../iss/IssMapCard';
import { IssMapModal } from '../iss/IssMapModal';

export function IssTracker() {
  const { trail, current, isLoading, isError, dataUpdatedAt, refetch } = useIssTrail();
  const [isOpen, setIsOpen] = useState(false);

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
        className="glass-panel rounded-xl overflow-hidden flex flex-col p-8 items-center justify-center text-center min-h-[300px]"
      >
        <Satellite className="text-red-400 w-12 h-12 mb-4 opacity-50" />
        <h3 className="text-white font-display text-lg mb-2">Telemetry Lost</h3>
        <p className="text-gray-400 text-sm max-w-[200px] mb-4">
          Unable to establish connection with ISS tracking satellite.
        </p>
        {dataUpdatedAt > 0 && (
          <p className="text-gray-600 text-xs font-mono mb-4">
            Last contact: {new Date(dataUpdatedAt).toLocaleTimeString()}
          </p>
        )}
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all text-xs font-mono"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Retry Connection
        </button>
      </motion.div>
    );
  }

  if (isLoading || !current) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
        className="glass-panel rounded-xl overflow-hidden"
      >
        <div className="p-5 grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-white/10 animate-pulse-subtle" />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <IssMapCard
          trail={trail}
          current={current}
          isLoading={isLoading}
          dataUpdatedAt={dataUpdatedAt}
          onExpand={() => setIsOpen(true)}
        />
      </motion.div>

      {isOpen && (
        <IssMapModal
          trail={trail}
          current={current}
          dataUpdatedAt={dataUpdatedAt}
          refetch={refetch}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
