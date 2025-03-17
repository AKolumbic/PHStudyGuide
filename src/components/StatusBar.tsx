import React from "react";

interface StatusBarProps {
  statusText: string;
  isLoading: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ statusText, isLoading }) => {
  return (
    <div className="status-bar">
      <span id="statusText">{statusText}</span>
      <span
        id="loadingIndicator"
        className="loading"
        style={{ display: isLoading ? "inline-block" : "none" }}
      ></span>
    </div>
  );
};

export default StatusBar;
