"use client";
import React, { useRef } from "react";
import { Zap } from "lucide-react";
import { TimelineContent } from "../../../components/ui/TimelineAnimation";

export default function AboutSection() {
  const sectionRef = useRef(null);

  const revealVariants = {
    visible: (i) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.4, // Adjusted delay for better flow
        duration: 0.8,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: 40,
      opacity: 0,
    },
  };

  const textVariants = {
    visible: (i) => ({
      filter: "blur(0px)",
      opacity: 1,
      transition: {
        delay: i * 0.15, // Faster stagger for text spans
        duration: 0.7,
      },
    }),
    hidden: {
      filter: "blur(8px)",
      opacity: 0,
    },
  };

  return (
    <section
      className="landing-section"
      style={{
        padding: "clamp(60px, 10vh, 100px) 24px",
        background: "var(--canvas)",
      }}
      ref={sectionRef}
    >
      <div
        className="landing-container"
        style={{ maxWidth: 1040, margin: "0 auto" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div style={{ flex: 1 }}>
            <TimelineContent
              as="div"
              animationNum={0}
              timelineRef={sectionRef}
              customVariants={revealVariants}
              style={{ marginBottom: 24 }}
            >
              <div
                className="eyebrow"
                style={{ color: "var(--arc)", justifyContent: "flex-start" }}
              >
                Our Vision
              </div>
            </TimelineContent>

            <TimelineContent
              as="h2"
              animationNum={1}
              timelineRef={sectionRef}
              customVariants={revealVariants}
              style={{
                fontSize: "clamp(32px, 5.5vw, 64px)",
                lineHeight: 1.05,
                fontWeight: 700,
                color: "var(--ink)",
                letterSpacing: "-0.04em",
                marginBottom: 48,
              }}
            >
              We are{" "}
              <TimelineContent
                as="span"
                animationNum={2}
                timelineRef={sectionRef}
                customVariants={textVariants}
                style={{
                  color: "var(--arc)",
                  border: "2px dashed var(--arc)",
                  display: "inline-block",
                  padding: "0 12px",
                  borderRadius: 12,
                  margin: "0 4px",
                }}
              >
                rethinking
              </TimelineContent>{" "}
              how stories are shared to be more effortless and always
              creator-first. Our goal is to continually raise the bar and{" "}
              <TimelineContent
                as="span"
                animationNum={3}
                timelineRef={sectionRef}
                customVariants={textVariants}
                style={{
                  color: "#3860be",
                  border: "2px dashed #3860be",
                  display: "inline-block",
                  padding: "0 12px",
                  borderRadius: 12,
                  margin: "0 4px",
                }}
              >
                challenge
              </TimelineContent>{" "}
              how multi-channel publishing could{" "}
              <TimelineContent
                as="span"
                animationNum={4}
                timelineRef={sectionRef}
                customVariants={textVariants}
                style={{
                  color: "#22c55e",
                  border: "2px dashed #22c55e",
                  display: "inline-block",
                  padding: "0 12px",
                  borderRadius: 12,
                  margin: "0 4px",
                }}
              >
                work for you.
              </TimelineContent>
            </TimelineContent>

            <div
              style={{
                marginTop: 64,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 32,
              }}
            >
              <TimelineContent
                as="div"
                animationNum={5}
                timelineRef={sectionRef}
                customVariants={textVariants}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--ink)",
                    marginBottom: 8,
                    textTransform: "capitalize",
                  }}
                >
                  We are GAP Social‑pilot and we will
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--slate)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  amplify your voice
                </div>
              </TimelineContent>

              <TimelineContent
                as="button"
                animationNum={6}
                timelineRef={sectionRef}
                customVariants={textVariants}
                className="cta-button"
                style={{
                  background: "var(--ink)",
                  color: "#fff",
                  gap: 10,
                  padding: "16px 32px",
                  borderRadius: "var(--r-pill)",
                  display: "inline-flex",
                  alignItems: "center",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <Zap fill="currentColor" size={18} />
                Learn about GAP Social‑pilot
              </TimelineContent>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
