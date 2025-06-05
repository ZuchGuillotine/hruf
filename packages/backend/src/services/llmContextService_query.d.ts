/**
 * @description      :
 * @author           :
 * @group            :
 * @created          : 13/03/2025 - 16:16:27
 *
 * MODIFICATION LOG
 * - Version         : 1.0.0
 * - Date            : 13/03/2025
 * - Author          :
 * - Modification    :
 **/
import { Message } from '@/lib/types';
export declare function constructQueryContext(
  userId: number | null,
  userQuery: string
): Promise<{
  messages: Message[];
}>;
//# sourceMappingURL=llmContextService_query.d.ts.map
