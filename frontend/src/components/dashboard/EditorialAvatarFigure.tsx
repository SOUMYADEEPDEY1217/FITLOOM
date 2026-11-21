"use client";

import React from "react";
import { LengthFieldKey } from "@/lib/body-profile-utils";

interface EditorialAvatarFigureProps {
  metricsCm: Partial<Record<LengthFieldKey, number>>;
  isCalibrated: boolean;
  variant?: "compact" | "workspace";
  activeZone?: LengthFieldKey;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function EditorialAvatarFigure({
  metricsCm,
  isCalibrated,
  variant = "compact",
  activeZone,
}: EditorialAvatarFigureProps) {
  const shoulderHalf = clamp(
    34 +
      (((isCalibrated ? metricsCm.shoulderCm : undefined) ?? 40) - 40) * 0.65,
    29,
    43,
  );
  const chestHalf = clamp(
    26 + (((isCalibrated ? metricsCm.chestCm : undefined) ?? 92) - 92) * 0.32,
    21,
    35,
  );
  const waistHalf = clamp(
    18.5 + (((isCalibrated ? metricsCm.waistCm : undefined) ?? 70) - 70) * 0.32,
    15,
    31,
  );
  const hipHalf = clamp(
    27 + (((isCalibrated ? metricsCm.hipCm : undefined) ?? 98) - 98) * 0.32,
    22,
    38,
  );

  const cx = 140;
  const sL = cx - shoulderHalf;
  const sR = cx + shoulderHalf;
  const cL = cx - chestHalf;
  const cR = cx + chestHalf;
  const wL = cx - waistHalf;
  const wR = cx + waistHalf;
  const hL = cx - hipHalf;
  const hR = cx + hipHalf;

  const isWorkspace = variant === "workspace";
  const gradientId = `fitloomVioletFigureFill-${variant}`;
  const zoneStroke = (zone: LengthFieldKey, defaultColor = "#8B74B8") =>
    isWorkspace && activeZone === zone ? "#6633EE" : defaultColor;
  const zoneWidth = (zone: LengthFieldKey, fallback = 1) =>
    isWorkspace && activeZone === zone ? 2.4 : fallback;

  return (
    <div
      className={
        variant === "compact"
          ? "relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#FAF8FE] via-[#F4EEFE] to-[#EDE9FE] px-3 py-4"
          : "relative flex w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[#FAF8FE] via-[#F4EEFE] to-[#EDE9FE] px-6 py-8 sm:py-10"
      }
      aria-label={
        isCalibrated
          ? "Illustrative 2D tailoring figure calibrated from your saved Body Profile"
          : "Neutral studio tailoring figure pending Body Profile calibration"
      }
    >
      <svg
        viewBox="0 0 280 410"
        className={
          variant === "compact" ? "h-36 w-auto sm:h-40" : "h-64 w-auto sm:h-76"
        }
        role="img"
        aria-label="FITLOOM illustrative 2D tailoring silhouette"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#EFE8FC" />
            <stop offset="100%" stopColor="#DDD6FE" />
          </linearGradient>
        </defs>

        <line
          x1={cx}
          y1="14"
          x2={cx}
          y2="396"
          stroke="#DDD6FE"
          strokeWidth="1"
          strokeDasharray="3 4"
        />

        <line
          x1="36"
          y1="86"
          x2="244"
          y2="86"
          stroke="#E6DCF8"
          strokeWidth="0.75"
        />
        <line
          x1="36"
          y1="226"
          x2="244"
          y2="226"
          stroke="#E6DCF8"
          strokeWidth="0.75"
        />

        <line
          x1="34"
          y1="26"
          x2="34"
          y2="382"
          stroke={zoneStroke("heightCm", "#C4B5FD")}
          strokeWidth={zoneWidth("heightCm", 1.1)}
          strokeDasharray="4 4"
        />
        <line
          x1="28"
          y1="26"
          x2="40"
          y2="26"
          stroke={zoneStroke("heightCm", "#C4B5FD")}
          strokeWidth="1.4"
        />
        <line
          x1="28"
          y1="382"
          x2="40"
          y2="382"
          stroke={zoneStroke("heightCm", "#C4B5FD")}
          strokeWidth="1.4"
        />

        <ellipse
          cx={cx}
          cy="44"
          rx="14"
          ry="17.5"
          fill={`url(#${gradientId})`}
          stroke="#4C1D95"
          strokeWidth="1.2"
        />
        <path
          d={`M ${cx - 6} 61 L ${cx - 7} 75 Q ${cx} 78 ${cx + 7} 75 L ${cx + 6} 61`}
          fill={`url(#${gradientId})`}
          stroke="#4C1D95"
          strokeWidth="1.1"
        />

        <path
          d={`
            M ${sL} 86
            C ${sL + 4} 75, ${cx - 10} 74, ${cx} 74
            C ${cx + 10} 74, ${sR - 4} 75, ${sR} 86
            L ${sR + 12} 202
            L ${sR + 1} 204
            L ${cR + 5} 122
            L ${cR} 134
            Q ${wR + 3} 170, ${wR} 182
            Q ${hR + 2} 210, ${hR - 2} 236
            L ${cx + 21} 378
            L ${cx + 7} 378
            L ${cx} 254
            L ${cx - 7} 378
            L ${cx - 21} 378
            L ${hL + 2} 236
            Q ${hL - 2} 210, ${wL} 182
            Q ${wL - 3} 170, ${cL} 134
            L ${cL - 5} 122
            L ${sL - 1} 204
            L ${sL - 12} 202
            Z
          `}
          fill={`url(#${gradientId})`}
          stroke="#6633EE"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />

        <line
          x1={sL}
          y1="86"
          x2={sR}
          y2="86"
          stroke={zoneStroke("shoulderCm", "#7C3AED")}
          strokeWidth={zoneWidth("shoulderCm", 1.1)}
          strokeDasharray={
            isWorkspace && activeZone === "shoulderCm" ? undefined : "3 3"
          }
        />

        <ellipse
          cx={cx}
          cy="128"
          rx={chestHalf + 2}
          ry="6"
          fill="none"
          stroke={zoneStroke("chestCm", "#8B5CF6")}
          strokeWidth={zoneWidth("chestCm", 1.1)}
          strokeDasharray={
            isWorkspace && activeZone === "chestCm" ? undefined : "4 3"
          }
        />

        <ellipse
          cx={cx}
          cy="181"
          rx={waistHalf + 2}
          ry="5.5"
          fill="none"
          stroke={zoneStroke("waistCm", "#8B5CF6")}
          strokeWidth={zoneWidth("waistCm", 1.1)}
          strokeDasharray={
            isWorkspace && activeZone === "waistCm" ? undefined : "4 3"
          }
        />

        <ellipse
          cx={cx}
          cy="226"
          rx={hipHalf + 2}
          ry="6.5"
          fill="none"
          stroke={zoneStroke("hipCm", "#8B5CF6")}
          strokeWidth={zoneWidth("hipCm", 1.1)}
          strokeDasharray={
            isWorkspace && activeZone === "hipCm" ? undefined : "4 3"
          }
        />

        <line
          x1={sR + 5}
          y1="88"
          x2={sR + 16}
          y2="201"
          stroke={zoneStroke("sleeveCm", "#A78BFA")}
          strokeWidth={zoneWidth("sleeveCm", 1.2)}
          strokeDasharray={
            isWorkspace && activeZone === "sleeveCm" ? undefined : "3 3"
          }
        />

        <line
          x1={cx + 3}
          y1="254"
          x2={cx + 9}
          y2="376"
          stroke={zoneStroke("inseamCm", "#A78BFA")}
          strokeWidth={zoneWidth("inseamCm", 1.2)}
          strokeDasharray={
            isWorkspace && activeZone === "inseamCm" ? undefined : "3 3"
          }
        />
      </svg>
    </div>
  );
}
