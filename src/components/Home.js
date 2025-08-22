import React, { useState, useEffect } from "react";

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

var offset = Intl.DateTimeFormat().resolvedOptions().timeZone;
var USTimeZones = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
];
var WorldWideTimeZones = [
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Australia/Darwin",
  "Europe/Paris",
  "Europe/Berlin",
  "Etc/GMT",
];
var AllTimeZones = [
  offset,
  ...USTimeZones.filter((tz) => tz !== offset),
  ...WorldWideTimeZones.filter((tz) => tz !== offset),
].sort((a, b) => a > b);

export const messageTypes = [
  "Boring",
  "Cute",
  "Aggressive",
  "Elon",
  "Raw",
  "Inverse",
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
      return moment().tz(selectedTimeZones[0]).zoneAbbr();
    } else {
      return `${selectedTimeZones.length} zones selected`;
    }
  };



  return (
    <div className="Body">
      <div className="main-layout">
        <div className="calendar-section">
          <MyCalendar initDate={new Date()} />
        </div>
        <div className="sidebar">
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
                        ? moment().tz(timeZone).zoneAbbr()
                        : moment().tz(timeZone).zoneAbbr() + " - " + timeZone}
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
                          ? moment().tz(timeZone).zoneAbbr()
                          : moment().tz(timeZone).zoneAbbr() + " - " + timeZone}
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
                        return (
                          <p key={i} style={{ textAlign: "left", fontSize: 13, marginBottom: 0 }}>
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
