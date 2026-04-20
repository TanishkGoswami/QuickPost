import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ComposerModal from "./ComposerModal";

/**
 * BroadcastForm - Wrapper component for the /compose route
 * Now uses the new ComposerModal instead of the old form
 */
function BroadcastForm() {
  const navigate = useNavigate();

  const handleClose = () => {
    // Redirect to dashboard when modal closes
    navigate("/dashboard");
  };

  const handlePostCreated = (result) => {
    // Redirect to dashboard after successful post
    navigate("/dashboard");
  };

  return (
    <ComposerModal
      isOpen={true}
      onClose={handleClose}
      onPostCreated={handlePostCreated}
    />
  );
}

export default BroadcastForm;
