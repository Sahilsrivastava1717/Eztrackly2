
"use client";

export default function MyOnboardingPage() {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      padding: "32px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,.04)",
    }}>
      <p style={{ fontSize: 15, color: "#6b7280", textAlign: "center" }}>
        You don't have an employee profile yet. Please contact your HR team.
      </p>
    </div>
  );
}
