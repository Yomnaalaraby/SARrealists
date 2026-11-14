'use client';

import { usePathname } from 'next/navigation';
import { AiAssistant } from './AiAssistant';

/**
 * Keep the landing page visually identical to the original project while
 * making LUMEN available everywhere else.
 */
export function AssistantMount() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return <AiAssistant />;
}

export default AssistantMount;
