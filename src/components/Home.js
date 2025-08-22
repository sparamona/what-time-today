import React, { useState, useEffect, useCallback } from "react";

import { useSelector, useDispatch } from "react-redux";
import CardContent from "@material-ui/core/CardContent";
import Card from "@material-ui/core/Card";
import { makeStyles } from "@material-ui/core/styles";
import { List } from "@material-ui/core";

import { copyToClipboard } from "../util/util";
import {
  DropdownButton,
  ToggleButtonGroup,
  ToggleButton,
  Dropdown,
  OverlayTrigger,
  Tooltip,
  Button,
} from "react-bootstrap";
import { outputToString } from "../util/dateTime";
import { clearAvailabilities } from "../redux/actions";
import { getAvailabilities } from "../redux/selectors";
import MyCalendar from "./mycalendar/MyCalendar.js";

const moment = require("moment-timezone");

// Custom timezone abbreviations
function getCustomTimezoneAbbr(timezone) {
  const customAbbreviations = {
    'Asia/Ho_Chi_Minh': 'ICT'
  };

  return customAbbreviations[timezone] || moment().tz(timezone).zoneAbbr();
}

var offset = Intl.DateTimeFormat().resolvedOptions().timeZone;
var USTimeZones = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
];
var PriorityTimeZones = [
  "Etc/GMT",
  "Asia/Ho_Chi_Minh",
];
var OtherTimeZones = [
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Australia/Darwin",
  "Europe/Paris",
  "Europe/Berlin",
];

// Reorder: US timezones, GMT, ICT, then the rest
var AllTimeZones = [
  offset,
  ...USTimeZones.filter((tz) => tz !== offset),
  ...PriorityTimeZones.filter((tz) => tz !== offset),
  ...OtherTimeZones.filter((tz) => tz !== offset),
];

export const messageTypes = [
  "Boring",
  "Cute",
  "Aggressive",
  "Elon",
  "Raw",
  "Inverse",
  "Table",
];

const classes = makeStyles({
  card: {
    borderRadius: 0,
    backgroundColor: "grey",
    color: "black",
    boxShadow: "none",
  },
});

export default function Home() {
  const dispatch = useDispatch();
  const [MonthDay, setMonthDay] = useState(true);
  const [selectedTimeZones, setSelectedTimeZones] = useState([offset]);
  const [availableTimeZones, setAvailableTimeZones] = useState(
    AllTimeZones.filter((tz) => tz !== offset)
  );
  const [AMPM, setAMPM] = useState(true);
  const [messageType, setMessageType] = useState(messageTypes[0]);
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    setAvailableTimeZones(AllTimeZones.filter((tz) => !selectedTimeZones.includes(tz)));
  }, [selectedTimeZones]);

  const { availabilities } = useSelector(getAvailabilities);

  const handleTimeZoneToggle = (timeZone) => {
    if (selectedTimeZones.includes(timeZone)) {
      // Remove timezone if already selected (but keep at least one)
      if (selectedTimeZones.length > 1) {
        setSelectedTimeZones(selectedTimeZones.filter(tz => tz !== timeZone));
      }
    } else {
      // Add timezone if not selected
      setSelectedTimeZones([...selectedTimeZones, timeZone]);
    }
  };

  const getTimeZoneDisplayTitle = () => {
    if (selectedTimeZones.length === 1) {
      return getCustomTimezoneAbbr(selectedTimeZones[0]);
    } else {
      return `${selectedTimeZones.length} zones selected`;
    }
  };

  // Resize functionality
  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;

    e.preventDefault();

    // Calculate new width based on mouse position relative to window
    const newWidth = window.innerWidth - e.clientX;

    // Set min and max width constraints
    const minWidth = 250;
    const maxWidth = Math.min(600, window.innerWidth * 0.6);

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add event listeners for mouse move and up on the document
  useEffect(() => {
    if (isResizing) {
      const handleGlobalMouseMove = (e) => handleMouseMove(e);
      const handleGlobalMouseUp = (e) => handleMouseUp(e);
      const handleKeyDown = (e) => {
        // Escape key to cancel resize
        if (e.key === 'Escape') {
          setIsResizing(false);
        }
      };

      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mouseleave', handleGlobalMouseUp); // Stop resize if mouse leaves window
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mouseleave', handleGlobalMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);



  return (
    <div className="Body">
      <div className={`main-layout ${isResizing ? 'resizing' : ''}`}>
        <div className="calendar-section">
          <MyCalendar initDate={new Date()} />
        </div>
        <div className="resize-handle" onMouseDown={handleMouseDown}></div>
        <div className="sidebar" style={{ width: sidebarWidth }}>
          <div className="sidebar-content">
            <h4 className="sidebar-title">Options</h4>
            <div className="options-section">
              <OverlayTrigger
                placement={"top"}
                overlay={
                  <Tooltip>
                    Select multiple time zones to show availability in different zones.
                  </Tooltip>
                }
              >
                <DropdownButton
                  variant="Light"
                  drop="down"
                  data-flip="false"
                  data-display="static"
                  id="dropdown-button-drop-down"
                  title={getTimeZoneDisplayTitle()}
                >
                  {/* Show selected timezones first */}
                  {selectedTimeZones.map((timeZone, i) => (
                    <Dropdown.Item
                      key={`selected-${i}`}
                      data-display="static"
                      data-flip="false"
                      as="a"
                      onClick={() => handleTimeZoneToggle(timeZone)}
                      style={{ backgroundColor: '#e3f2fd', fontWeight: 'bold' }}
                    >
                      ✓ {window.innerWidth < 850
                        ? getCustomTimezoneAbbr(timeZone)
                        : getCustomTimezoneAbbr(timeZone) + " - " + timeZone}
                    </Dropdown.Item>
                  ))}

                  {selectedTimeZones.length > 0 && availableTimeZones.length > 0 && (
                    <Dropdown.Divider />
                  )}

                  {/* Show available timezones */}
                  {availableTimeZones
                    .sort((a, b) => a > b)
                    .map((timeZone, i) => (
                      <Dropdown.Item
                        key={`available-${i}`}
                        data-display="static"
                        data-flip="false"
                        as="a"
                        onClick={() => handleTimeZoneToggle(timeZone)}
                      >
                        {window.innerWidth < 850
                          ? getCustomTimezoneAbbr(timeZone)
                          : getCustomTimezoneAbbr(timeZone) + " - " + timeZone}
                      </Dropdown.Item>
                    ))}
                </DropdownButton>
              </OverlayTrigger>

              <OverlayTrigger
                placement={"top"}
                overlay={<Tooltip>12hr vs 24hr time format.</Tooltip>}
              >
                <ToggleButtonGroup
                  type="checkbox"
                  defaultValue={1}
                  onChange={(val) => setAMPM(val.length !== 0)}
                >
                  <ToggleButton value={1} variant="Light">
                    {AMPM ? "AM/PM" : "24hr"}
                  </ToggleButton>
                </ToggleButtonGroup>
              </OverlayTrigger>

              <OverlayTrigger
                placement={"top"}
                overlay={<Tooltip>Again, not everyone is from America.</Tooltip>}
              >
                <ToggleButtonGroup
                  type="checkbox"
                  defaultValue={1}
                  onChange={(val) => setMonthDay(val.length !== 0)}
                >
                  <ToggleButton value={1} variant="Light">
                    {MonthDay ? "Month/Day" : "Day/Month"}
                  </ToggleButton>
                </ToggleButtonGroup>
              </OverlayTrigger>

              <OverlayTrigger
                placement={"top"}
                overlay={<Tooltip>Choose your message style or format.</Tooltip>}
              >
                <DropdownButton
                  variant="Light"
                  drop="down"
                  id="message-type-dropdown"
                  title={messageType}
                >
                  {messageTypes.map((type, i) => (
                    <Dropdown.Item
                      key={i}
                      as="a"
                      onClick={() => {
                        setMessageType(type);
                      }}
                      style={messageType === type ? { backgroundColor: '#e3f2fd', fontWeight: 'bold' } : {}}
                    >
                      {messageType === type ? '✓ ' : ''}{type}
                    </Dropdown.Item>
                  ))}
                </DropdownButton>
              </OverlayTrigger>
            </div>

            <div className="availability-section">
              <h5 className="availability-title">Your Availability</h5>
              <Card
                className="output-card"
                classes={{ root: classes.card }}
                variant="outlined"
              >
                <List style={{ maxHeight: 300, overflow: "auto" }}>
                  <CardContent>
                    {availabilities.length === 0 ? (
                      <p style={{ textAlign: "center", fontSize: 13, color: "#666", fontStyle: "italic" }}>
                        Nothing selected. Click and drag on the calendar to select availability.
                      </p>
                    ) : (
                      outputToString(
                        availabilities,
                        selectedTimeZones,
                        messageType,
                        AMPM,
                        MonthDay
                      ).map((out, i) => {
                        const isTableFormat = messageType === "Table";
                        const isTableHeader = isTableFormat && (i === 0 || i === 2 || i === 3); // Header, empty line, or separator
                        const isTableSeparator = isTableFormat && out.includes("---");

                        return (
                          <p
                            key={i}
                            style={{
                              textAlign: "left",
                              fontSize: 13,
                              marginBottom: 0,
                              fontFamily: isTableFormat ? 'monospace' : 'inherit',
                              fontWeight: isTableHeader && !isTableSeparator ? 'bold' : 'normal',
                              whiteSpace: isTableFormat ? 'pre' : 'normal'
                            }}
                          >
                            {out}
                          </p>
                        );
                      })
                    )}
                  </CardContent>
                </List>
              </Card>

              <div className="action-buttons">
                {document.queryCommandSupported("copy") && (
                  <OverlayTrigger
                    placement={"top"}
                    overlay={<Tooltip>Copy to your clipboard.</Tooltip>}
                  >
                    <Button
                      variant="Light"
                      onClick={(e) => {
                        var xhr = new XMLHttpRequest();
                        xhr.open(
                          "GET",
                          "https://api.countapi.xyz/hit/whattime.today/copy"
                        );
                        xhr.responseType = "json";
                        xhr.send();
                        copyToClipboard(
                          e,
                          "lol",
                          availabilities,
                          selectedTimeZones,
                          messageType,
                          AMPM,
                          MonthDay
                        );
                      }}
                    >
                      Copy
                    </Button>
                  </OverlayTrigger>
                )}

                <OverlayTrigger
                  placement={"top"}
                  overlay={<Tooltip>Clean up your mess.</Tooltip>}
                >
                  <Button
                    variant="Light"
                    onClick={() => {
                      dispatch(clearAvailabilities());
                    }}
                  >
                    Clear
                  </Button>
                </OverlayTrigger>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="lol" style={{ visibility: "hidden" }}></div>
    </div>
  );
}
