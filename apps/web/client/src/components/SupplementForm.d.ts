/**
 * Interface for SupplementForm component props
 */
interface SupplementFormProps {
  supplementId?: number;
  onSuccess: () => void;
}
/**
 * SupplementForm Component
 * Handles both creation and editing of supplements
 *
 * @param supplementId - Optional ID of supplement being edited
 * @param onSuccess - Callback function after successful submission
 */
export default function SupplementForm({
  supplementId,
  onSuccess,
}: SupplementFormProps): import('react/jsx-runtime').JSX.Element;
export {};
//# sourceMappingURL=SupplementForm.d.ts.map
