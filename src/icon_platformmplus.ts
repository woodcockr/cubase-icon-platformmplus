// Polyfills
import "core-js/actual/array/iterator";
import "core-js/actual/array/from";
import "core-js/actual/array/reverse";
import "core-js/actual/array/flat-map";
import "core-js/actual/string/pad-start";
import "core-js/actual/string/replace-all";
import "core-js/actual/object/entries";
import "core-js/actual/reflect/construct";

// @ts-ignore Workaround because the core-js polyfill doesn't play nice with SWC:
Reflect.get = undefined;

import midiremote_api from "midiremote_api_v1";
import { SurfaceElements, ChannelControl, makeChannelControl, makeMasterControl, makeTransport, Helper_updateDisplay, clearAllLeds } from "./icon_elements";
import { makePageWithDefaults } from "./master_controls"
import { setTextOfColumn, setTextOfLine, makeLabel } from "./helper"
import * as mixer from "./mixer"
import * as control_room from "./control_room"
import * as midi from "./midi"
import * as selected_track from "./selected_track"
import * as channel_strip from "./channel_strip"

// create the device driver main object
const deviceDriver = midiremote_api.makeDeviceDriver('Icon', 'Platform Mplus', 'Big Fat Wombat');

// create objects representing the hardware's MIDI ports
const midiInput = deviceDriver.mPorts.makeMidiInput('Platform M+');
const midiOutput = deviceDriver.mPorts.makeMidiOutput('Platform M+');
const midiPageInput = deviceDriver.mPorts.makeMidiInput('Icon CC');
const midiPageOutput = deviceDriver.mPorts.makeMidiOutput('Icon CC');

deviceDriver.mOnActivate = function (activeDevice: MR_ActiveDevice) {
  console.log('Icon Platform M+ Activated');
  clearAllLeds(activeDevice, midiOutput)
  var display = {
    row1: "Welcome to ICON Platform M+",
    row2: "MIDI Remote",
    indicator1: " ",
    indicator2: "N"
  }
  activeDevice.setState('display',JSON.stringify(display))
  var master_fader = {
    title: "No AI Parameter under mouse",
    value: ' ',
    display_stash: ''
  }
  activeDevice.setState('master_fader', JSON.stringify(master_fader))
};

deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
  .expectInputNameContains('Platform M+')
  .expectOutputNameContains('Platform M+')

deviceDriver.makeDetectionUnit().detectPortPair(midiPageInput, midiPageOutput)
  .expectOutputNameEquals('Icon CC')

var surface = deviceDriver.mSurface

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------
function makeSurfaceElements(surface: MR_DeviceSurface): SurfaceElements {
  const channelControls: Array<ChannelControl> = []

  var xKnobStrip = 0
  var yKnobStrip = 5
  const numStrips = 8

  for (var i = 0; i < numStrips; ++i) {
    channelControls[i] = makeChannelControl(surface, midiInput, midiOutput, xKnobStrip, yKnobStrip, i)
  }

  const faderMaster = makeMasterControl(surface, midiInput, midiOutput, xKnobStrip + 1, yKnobStrip + 4, numStrips)
  const transport = makeTransport(surface, midiInput, midiOutput, xKnobStrip + 63, yKnobStrip + 4)

  // Track the selected track name
  const selectedTrack = surface.makeCustomValueVariable('selectedTrack');
  selectedTrack.mOnTitleChange = function (activeDevice, objectTitle, valueTitle) {
    console.log('selectedTrack title change:' + objectTitle)
    activeDevice.setState('selectedTrackName', objectTitle)
  }

  return {
    d2Display: surface.makeBlindPanel(0, 0, 56, 6),
    numStrips: numStrips,
    channelControls: channelControls,
    faderMaster: faderMaster,
    transport: transport,
    selectedTrack: selectedTrack
  }

}

var surfaceElements = makeSurfaceElements(surface)

var mixerPage = mixer.makePage(surfaceElements, deviceDriver, midiOutput)
var selectedTrackPage = selected_track.makePage(surfaceElements, deviceDriver, midiOutput)
var channelStripPage = channel_strip.makePage(surfaceElements, deviceDriver, midiOutput)
var controlRoomPage = control_room.makePage(surfaceElements, deviceDriver, midiOutput)
var midiPage = midi.makePage(surfaceElements, deviceDriver, midiOutput, midiPageOutput)

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping mixerPages and host bindings
//-----------------------------------------------------------------------------

// Helper functions
function makeSubPage(subPageArea: MR_SubPageArea, name: string) {
  var subPage = subPageArea.makeSubPage(name)
  var msgText = 'sub page ' + name + ' activated'
  // WIP Refactor of mOnActivate required everywhere.
  subPage.mOnActivate = function (activeDevice: MR_ActiveDevice) {
    // console.log(msgText)
    var activePage = activeDevice.getState("activePage")
    var activeSubPage = name
    switch (activePage) {
      case "SelectedTrack":
        switch (activeSubPage) {
          case "SendsQC":
            // An action binding cannot be set to a Toggle type button so manually adjust the rec button lights
            // based on the subpage selection.
            midiOutput.sendMidi(activeDevice, [0x90, 0, 127])
            midiOutput.sendMidi(activeDevice, [0x90, 1, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 2, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 3, 0])
            activeDevice.setState("activeSubPage", activeSubPage)
            break;
          case "EQ":
            // An action binding cannot be set to a Toggle type button so manually adjust the rec button lights
            // based on the subpage selection.
            midiOutput.sendMidi(activeDevice, [0x90, 0, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 1, 127])
            midiOutput.sendMidi(activeDevice, [0x90, 2, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 3, 0])
            activeDevice.setState("activeSubPage", activeSubPage)
            break;
          case "PreFilter":
            // An action binding cannot be set to a Toggle type button so manually adjust the rec button lights
            // based on the subpage selection.
            midiOutput.sendMidi(activeDevice, [0x90, 0, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 1, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 2, 127])
            midiOutput.sendMidi(activeDevice, [0x90, 3, 0])
            activeDevice.setState("activeSubPage", activeSubPage)
            break;
          case "CueSends":
            // An action binding cannot be set to a Toggle type button so manually adjust the rec button lights
            // based on the subpage selection.
            midiOutput.sendMidi(activeDevice, [0x90, 0, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 1, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 2, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 3, 127])
            activeDevice.setState("activeSubPage", activeSubPage)
            break;
        }
        break;
      case "ChannelStrip":
        switch (activeSubPage) {
          case "Gate":
            // An action binding cannot be set to a Toggle type button so manually adjust the sel button lights
            // based on the subpage selection.
            midiOutput.sendMidi(activeDevice, [0x90, 24, 127])
            midiOutput.sendMidi(activeDevice, [0x90, 25, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 26, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 27, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 28, 0])
            activeDevice.setState("activeSubPage", activeSubPage)
            break;
          case "Compressor":
            // An action binding cannot be set to a Toggle type button so manually adjust the sel button lights
            // based on the subpage selection.
            midiOutput.sendMidi(activeDevice, [0x90, 24, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 25, 127])
            midiOutput.sendMidi(activeDevice, [0x90, 26, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 27, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 28, 0])
            activeDevice.setState("activeSubPage", activeSubPage)
            break;
          case "Tools":
            // An action binding cannot be set to a Toggle type button so manually adjust the sel button lights
            // based on the subpage selection.
            midiOutput.sendMidi(activeDevice, [0x90, 24, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 25, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 26, 127])
            midiOutput.sendMidi(activeDevice, [0x90, 27, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 28, 0])
            activeDevice.setState("activeSubPage", activeSubPage)
            break;
          case "Saturator":
            // An action binding cannot be set to a Toggle type button so manually adjust the sel button lights
            // based on the subpage selection.
            midiOutput.sendMidi(activeDevice, [0x90, 24, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 25, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 26, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 27, 127])
            midiOutput.sendMidi(activeDevice, [0x90, 28, 0])
            activeDevice.setState("activeSubPage", activeSubPage)
            break;
          case "Limiter":
            // An action binding cannot be set to a Toggle type button so manually adjust the sel button lights
            // based on the subpage selection.
            midiOutput.sendMidi(activeDevice, [0x90, 24, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 25, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 26, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 27, 0])
            midiOutput.sendMidi(activeDevice, [0x90, 28, 127])
            activeDevice.setState("activeSubPage", activeSubPage)
            break;
        }
        break;
    }
    Helper_updateDisplay('Row1', 'Row2', 'AltRow1', 'AltRow2', activeDevice, midiOutput)
  }
  return subPage
}

// Function to clear out the Channel State for the display titles/values
// the OnDisplayChange callback is not called if the Channel doesn't have an updated
// Title. So swtiching to QC would leave the old Mixer Page "Volume" title kicking around
// in the state. By clearing state on the page activation it will update all that are changing.
function clearChannelState(activeDevice: MR_ActiveDevice) {
  var activePage = activeDevice.getState("activePage")
  var activeSubPage = activeDevice.getState("activeSubPage")
  // console.log('from script: clearChannelState'+activePage)

  activeDevice.setState(activePage + "- " + activeSubPage + ' - Fader - Title', "")
  activeDevice.setState(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', "")
  activeDevice.setState(activePage + "- " + activeSubPage + ' - Fader - Values', "")
  activeDevice.setState(activePage + "- " + activeSubPage + ' - Pan - Title', "")
  activeDevice.setState(activePage + "- " + activeSubPage + ' - Pan - ValueTitles', "")
  activeDevice.setState(activePage + "- " + activeSubPage + ' - Pan - Values', "")

  activeDevice.setState("displayType", "Fader")
}

