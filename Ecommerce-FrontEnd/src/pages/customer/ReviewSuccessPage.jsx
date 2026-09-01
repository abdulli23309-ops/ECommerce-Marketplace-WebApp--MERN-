import ReviewSuccessConfirmation from "../../components/common/ReviewSuccessConfirmation";

/**
 * ReviewSuccessPage
 *
 * Thin route-level wrapper that renders ReviewSuccessConfirmation inside the
 * CustomerLayout shell. The confirmation component itself only concerns itself
 * with presentational logic, so this wrapper keeps routing/layout concerns out
 * of the component. If the confirmation component is ever needed in a context
 * without the customer layout (e.g. an embedded widget), it can still be
 * imported directly.
 */
const ReviewSuccessPage = () => {
  return <ReviewSuccessConfirmation />;
};

export default ReviewSuccessPage;
