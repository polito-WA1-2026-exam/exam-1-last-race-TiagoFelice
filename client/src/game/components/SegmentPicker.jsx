import { useMemo } from 'react'
import { segmentKey } from '../utils/route'

export function SegmentPicker({
  segments,
  currentStationId,
  route,
  onSelectSegment,
}) {
  const usedSegmentKeys = useMemo(
    () =>
      new Set(
        route.map((step) => segmentKey(step.fromStationId, step.toStationId)),
      ),
    [route],
  )

  const availableSegments = segments.filter(
    (segment) =>
      segment.fromStationId === currentStationId ||
      segment.toStationId === currentStationId,
  )

  return (
    <div className="segment-list" aria-label="Available route segments">
      {availableSegments.length === 0 ? (
        <p className="muted">No unused segment leaves the current station.</p>
      ) : null}

      {availableSegments.map((segment) => {
        const key = segmentKey(segment.fromStationId, segment.toStationId)
        const used = usedSegmentKeys.has(key)
        const nextStationName =
          segment.fromStationId === currentStationId
            ? segment.toStationName
            : segment.fromStationName

        return (
          <button
            className="segment-button"
            disabled={used}
            key={segment.key}
            type="button"
            onClick={() => onSelectSegment(segment)}
          >
            <span>{nextStationName}</span>
            <span>{used ? 'used' : 'select'}</span>
          </button>
        )
      })}
    </div>
  )
}
