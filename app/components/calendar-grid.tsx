import ReactGridLayout, { Responsive, WidthProvider } from "react-grid-layout";
import { Fragment, useMemo, useState } from "react";
import { throttleEventBy } from "~/utils/misc";
import dayjs from "dayjs";
import { convertTimeComponentsToMinutesOffset } from "~/utils/datetime";
import clsx from "clsx";
import { formatTime24FromMinutes } from "~/utils/format";
import { IconArrowsVertical } from "~/utils/icons";

const ResponsiveGridLayout = WidthProvider(Responsive);

type CalendarGridProps = React.PropsWithChildren<{
  days: Date[];
  timeRange: {
    start: { hour: number; minute: number };
    end: { hour: number; minute: number };
  };
  layouts: ReactGridLayout.Layouts;
  itemIds: string[];
  renderItem: (id: string) => React.ReactNode;
  onItemMove: (id: string, x: number, y: number, height: number) => void;
  onItemResize: (id: string, x: number, y: number, height: number) => void;
  onDragStart?: ReactGridLayout.ItemCallback;
  onDragStop?: ReactGridLayout.ItemCallback;
  onResizeStop?: ReactGridLayout.ItemCallback;
}>;
export default function CalendarGrid({
  days,
  timeRange,
  layouts,
  onItemMove,
  onItemResize,
  onDragStart,
  onDragStop,
  onResizeStop,
  itemIds,
  renderItem,
  children,
}: CalendarGridProps) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const rowHeight = useMemo(
    () =>
      ref
        ? Math.max(Math.floor(ref.getBoundingClientRect().height / 44), 20)
        : 0,
    [ref]
  );
  const times = useMemo(() => {
    const tempTimes = [];
    for (
      let time = convertTimeComponentsToMinutesOffset(timeRange.start);
      time < convertTimeComponentsToMinutesOffset(timeRange.end);
      time += 60
    ) {
      tempTimes.push({ hour: Math.floor(time / 60), minute: time % 60 });
    }
    return tempTimes;
  }, [timeRange]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemPosition, setDraggedItemPosition] =
    useState<DOMRect | null>(null);
  const [draggedItemInfo, setDraggedItemInfo] =
    useState<ReactGridLayout.Layout | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizedItemPosition, setResizedItemPosition] =
    useState<DOMRect | null>(null);
  const [resizedItemInfo, setResizedItemInfo] =
    useState<ReactGridLayout.Layout | null>(null);

  return (
    <div className="relative flex-1 overflow-auto">
      <div
        className="relative grid min-w-[200%] flex-1 grid-cols-[1fr_,auto] grid-rows-[auto_,8px_,1fr] sm:min-w-full"
        ref={setRef}
        dir="ltr"
      >
        {/* Drag item indicator */}
        <div
          className={clsx([
            "absolute z-[45] h-px bg-red-400",
            {
              hidden: !isDragging,
            },
          ])}
          style={{
            top:
              draggedItemPosition && ref
                ? draggedItemPosition.top - ref.getBoundingClientRect().top
                : 56,
            right:
              ref && ref.parentElement ? 0 - ref.parentElement.scrollLeft : 0,
            left:
              draggedItemPosition && ref
                ? draggedItemPosition.left -
                  ref.getBoundingClientRect().left +
                  4
                : 80,
          }}
        >
          <span className="absolute top-0 right-0 -translate-y-1/2 rounded bg-red-500 px-1 text-xs text-white">
            {draggedItemInfo
              ? formatTime24FromMinutes(draggedItemInfo.y * 15 + 8 * 60)
              : ""}
          </span>
        </div>

        {/* Resize item indicator */}
        <div
          className={clsx([
            "absolute z-[45] h-px bg-gray-400",
            {
              hidden: !isResizing,
            },
          ])}
          style={{
            top:
              resizedItemPosition && ref
                ? resizedItemPosition.top -
                  ref.getBoundingClientRect().top +
                  resizedItemPosition.height
                : 0,
            right:
              ref && ref.parentElement ? 0 - ref.parentElement.scrollLeft : 0,
            left:
              resizedItemPosition && ref
                ? resizedItemPosition.left -
                  ref.getBoundingClientRect().left +
                  4
                : 80,
          }}
        >
          <span
            className="absolute top-0 right-0 -translate-y-1/2 rounded bg-black px-1 text-xs text-white"
            dir="rtl"
          >
            {resizedItemInfo
              ? `${formatTime24FromMinutes(
                  8 * 60 + (resizedItemInfo.y + resizedItemInfo.h) * 15
                )} (סיום השיעור)`
              : ""}
          </span>
        </div>

        {/* Header */}
        <div
          className="sticky top-0 z-[45] col-span-2 col-start-1 row-start-1 grid select-none divide-x divide-gray-100 border-b border-gray-200 bg-white"
          style={{
            gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr)) 40px`,
          }}
        >
          {[...days].reverse().map((day) => (
            <div
              key={day.toISOString()}
              className="flex flex-col-reverse items-center justify-center pb-2.5 sm:flex-row-reverse sm:pb-3"
            >
              <span className="text-xs text-gray-500 sm:text-sm">
                {dayjs(day).format("dddd")}
              </span>
              <span
                className={clsx([
                  "grid h-6 w-6 place-content-center rounded-full text-sm font-medium ltr:sm:ml-2 rtl:sm:mr-2",
                  {
                    "bg-amber-500 text-white": dayjs().isSame(day, "date"),
                  },
                  {
                    "text-gray-500": !dayjs().isSame(day, "date"),
                  },
                ])}
              >
                {dayjs(day).format("DD")}
              </span>
            </div>
          ))}
          <div className="sticky right-0 top-0 bg-white"></div>
        </div>

        {/* Spacer (between the header and the rest of the grid) */}
        <div
          className="col-span-2 col-start-1 row-span-1 row-start-2 grid divide-x divide-gray-100"
          style={{
            gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr)) 40px`,
          }}
        >
          {days.map((day) => (
            <div key={day.toISOString()}></div>
          ))}
          <div></div>
        </div>

        {/* Times */}
        <div
          className="sticky right-0 z-40 col-start-2 row-start-3 grid select-none border-l border-gray-100 bg-white"
          style={{
            gridTemplateRows: `repeat(${times.length * 2}, ${rowHeight * 2}px)`, // prettier-ignore
          }}
        >
          {times.map((time) => (
            <Fragment key={convertTimeComponentsToMinutesOffset(time)}>
              <div className="relative w-10">
                <span className="absolute right-0 -mt-2 text-right text-xs leading-5 text-gray-400">
                  {time.hour.toString().padStart(2, "0")}:
                  {time.minute.toString().padStart(2, "0")}
                </span>
              </div>
              <div></div>
            </Fragment>
          ))}
        </div>

        {/* Horizontal lines */}
        <div
          className="col-span-1 col-start-1 row-start-3 grid select-none divide-y divide-gray-100 border-t border-gray-100"
          style={{
            gridTemplateRows: `repeat(${times.length * 2}, ${rowHeight * 2}px)`, // prettier-ignore
          }}
        >
          {times.map((time) => (
            <Fragment key={convertTimeComponentsToMinutesOffset(time)}>
              <div>
                {/* <div className="absolute right-0 z-20 -mt-2.5 w-14 pr-3 text-right text-xs leading-5 text-gray-400">
                  {time.hour.toString().padStart(2, "0")}:
                  {time.minute.toString().padStart(2, "0")}
                </div> */}
              </div>
              <div />
            </Fragment>
          ))}
        </div>

        {/* Vertical lines */}
        <div
          className="col-span-1 col-start-1 row-start-3 grid select-none divide-x divide-gray-100"
          style={{
            gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
          }}
        >
          {days.map((day) => (
            <div key={day.toISOString()}></div>
          ))}
        </div>

        <ResponsiveGridLayout
          className="relative col-span-1 col-start-1 row-start-3"
          layouts={layouts}
          cols={{
            xxs: days.length,
            xs: days.length,
            sm: days.length,
            md: days.length,
            lg: days.length,
          }}
          maxRows={4 * times.length}
          rowHeight={rowHeight}
          autoSize={false}
          isBounded={true}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          compactType={null}
          preventCollision={true}
          draggableCancel=".cancel-drag"
          draggableHandle=".drag-handle"
          resizeHandle={
            <div className="react-resizable-handle absolute bottom-0 left-1/2 -translate-x-1/2">
              <IconArrowsVertical className="h-3 w-auto cursor-row-resize text-white/80" />
            </div>
          }
          onDrag={throttleEventBy<ReactGridLayout.ItemCallback>(
            (layout, oldItem, newItem, placeholder, event, elem) => {
              if (!isDragging) {
                setIsDragging(true);
              }
              setDraggedItemPosition(elem.getBoundingClientRect());
              setDraggedItemInfo(newItem);
              onItemMove(newItem.i, newItem.x, newItem.y, newItem.h);
            },
            150
          )}
          onDragStart={onDragStart}
          onDragStop={(...args) => {
            setIsDragging(false);
            setDraggedItemPosition(null);
            setDraggedItemInfo(null);
            typeof onDragStop === "function" && onDragStop(...args);
          }}
          onResize={throttleEventBy<ReactGridLayout.ItemCallback>(
            (layout, oldItem, newItem, placeholder, event, elem) => {
              if (!isResizing) {
                setIsResizing(true);
              }
              setResizedItemPosition(elem.getBoundingClientRect());
              setResizedItemInfo(newItem);
              onItemResize(newItem.i, newItem.x, newItem.y, newItem.h);
            },
            150
          )}
          onResizeStop={(...args) => {
            setIsResizing(false);
            setResizedItemPosition(null);
            setResizedItemInfo(null);
            typeof onResizeStop === "function" && onResizeStop(...args);
          }}
        >
          {itemIds.map((id) => (
            <div key={id} className="relative flex flex-col p-1">
              {renderItem(id)}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}
