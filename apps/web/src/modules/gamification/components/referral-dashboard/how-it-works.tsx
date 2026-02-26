/**
 * How It Works
 *
 * Instructional card explaining the referral process.
 */

/**
 * unknown for the gamification module.
 */
/**
 * How It Works component.
 */
export function HowItWorks() {
  return (
    <div className="bg-card border-border rounded-lg border p-4">
      <h3 className="text-foreground mb-3 font-semibold">How it Works</h3>
      <ol className="text-muted-foreground space-y-3 text-sm">
        <li className="flex items-start gap-2">
          <span className="bg-primary text-primary-foreground flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs">
            1
          </span>
          Share your referral link with friends
        </li>
        <li className="flex items-start gap-2">
          <span className="bg-primary text-primary-foreground flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs">
            2
          </span>
          They sign up using your link
        </li>
        <li className="flex items-start gap-2">
          <span className="bg-primary text-primary-foreground flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs">
            3
          </span>
          Once verified, you both get rewards!
        </li>
      </ol>
    </div>
  );
}
