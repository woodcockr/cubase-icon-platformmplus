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
var selectedTrackPage = makePageSelectedTrack()
var channelStripPage = makePageChannelStrip()
var controlRoomPage = control_room.makePage(surfaceElements, deviceDriver, midiOutput)
var midiPage = midi.makePage(surfaceElements, deviceDriver, midiOutput, midiPageOutput)

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping mixerPages and host bindings
//-----------------------------------------------------------------------------

// Helper functions
function makeSubPage(subPageArea: MR_SubPageArea, name: string) {
  var subPage = subPageArea.makeSubPage(name)
  var msgText = 'sub page ' + name + ' activated'
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

function makePageSelectedTrack() {
  var page = makePageWithDefaults('Selected Channel', surfaceElements, deviceDriver, midiOutput)

  var faderSubPageArea = page.makeSubPageArea('Faders')
  var subPageSendsQC = makeSubPage(faderSubPageArea, 'SendsQC')
  var subPageEQ = makeSubPage(faderSubPageArea, 'EQ')
  var subPageCueSends = makeSubPage(faderSubPageArea, 'CueSends')
  var subPagePreFilter = makeSubPage(faderSubPageArea, 'PreFilter')

  var selectedTrackChannel = page.mHostAccess.mTrackSelection.mMixerChannel

  // Custom variable for track the selectedTrack so we can get to it's name
  page.makeValueBinding(surfaceElements.selectedTrack, selectedTrackChannel.mValue.mVolume)
  page.makeValueBinding(surfaceElements.selectedTrack, selectedTrackChannel.mValue.mVolume) // ! Duplicate to overcome C12.0.60+ bug
  /// SendsQC subPage
  // Sends on PushEncodes and mute button for pre/post
  // Focus QC on Faders
  // Fader
  for (var idx = 0; idx < surfaceElements.numStrips; ++idx) {
      var knobSurfaceValue = surfaceElements.channelControls[idx].pushEncoder.mEncoderValue;
      var knobPushValue = surfaceElements.channelControls[idx].pushEncoder.mPushValue;
      var faderSurfaceValue = surfaceElements.channelControls[idx].fader.mSurfaceValue;

      var quickControlValue = page.mHostAccess.mFocusedQuickControls.getByIndex(idx) // ! Weird: If this isn't a var in the line below but a direct call then Cubase will not bind values correctly
      var sends = selectedTrackChannel.mSends.getByIndex(idx)

      page.makeValueBinding(knobSurfaceValue, sends.mLevel).setSubPage(subPageSendsQC)
      page.makeValueBinding(knobPushValue, sends.mOn).setTypeToggle().setSubPage(subPageSendsQC)
      page.makeValueBinding(faderSurfaceValue, quickControlValue).setValueTakeOverModeJump().setSubPage(subPageSendsQC)
      page.makeValueBinding(faderSurfaceValue, quickControlValue).setValueTakeOverModeJump().setSubPage(subPageSendsQC) // ! Duplicate to overcome C12.0.60+ bug

      page.makeValueBinding(surfaceElements.channelControls[idx].sel_button.mSurfaceValue, selectedTrackChannel.mSends.getByIndex(idx).mOn).setTypeToggle().setSubPage(subPageSendsQC)
      page.makeValueBinding(surfaceElements.channelControls[idx].mute_button.mSurfaceValue, selectedTrackChannel.mSends.getByIndex(idx).mPrePost).setTypeToggle().setSubPage(subPageSendsQC)

      // The use of bind below assures the idx is the correct value for the onTitleChange function
      const qcOnTitleChange = {
          idx: idx,
          onTitleChange: function(activeDevice: MR_ActiveDevice,activeMapping: MR_ActiveMapping,objectTitle: string, valueTitle: string ) {
              var activePage = activeDevice.getState("activePage")
              var activeSubPage = activeDevice.getState("activeSubPage")
              var faderValueTitles = activeDevice.getState(activePage + "- " + activeSubPage + ' - Fader - ValueTitles')
              // console.log("QC Title Changed:" +this.idx+":" + objectTitle + ":" + valueTitle)
              switch (activePage) {
              case "SelectedTrack":
                  switch (activeSubPage) {
                      case "SendsQC":
                          var title = valueTitle
                          if (title.length === 0) {
                              title = "None"
                          }
                          activeDevice.setState(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', setTextOfColumn(this.idx, makeLabel(title, 6), faderValueTitles))
                          Helper_updateDisplay(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', activePage + "- " + activeSubPage + ' - Fader - Values', activePage + "- " + activeSubPage + ' - Pan - ValueTitles', activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, midiOutput)
                          break;
                  }
                  break;
              }
          }
      }
      quickControlValue.mOnTitleChange = qcOnTitleChange.onTitleChange.bind(qcOnTitleChange)

  }

  // Handy controls for easy access
  page.makeCommandBinding(surfaceElements.channelControls[4].solo_button.mSurfaceValue, 'Automation', 'Show Used Automation (Selected Tracks)').setSubPage(subPageSendsQC)
  page.makeCommandBinding(surfaceElements.channelControls[5].solo_button.mSurfaceValue, 'Automation', 'Hide Automation').setSubPage(subPageSendsQC)
  page.makeValueBinding(surfaceElements.channelControls[6].solo_button.mSurfaceValue, selectedTrackChannel.mValue.mEditorOpen).setTypeToggle().setSubPage(subPageSendsQC)
  page.makeValueBinding(surfaceElements.channelControls[7].solo_button.mSurfaceValue, selectedTrackChannel.mValue.mInstrumentOpen).setTypeToggle().setSubPage(subPageSendsQC)

  page.makeValueBinding(surfaceElements.channelControls[4].rec_button.mSurfaceValue, selectedTrackChannel.mValue.mMonitorEnable).setTypeToggle().setSubPage(subPageSendsQC)
  page.makeValueBinding(surfaceElements.channelControls[5].rec_button.mSurfaceValue, selectedTrackChannel.mValue.mMute).setTypeToggle().setSubPage(subPageSendsQC)
  page.makeValueBinding(surfaceElements.channelControls[6].rec_button.mSurfaceValue, selectedTrackChannel.mValue.mSolo).setTypeToggle().setSubPage(subPageSendsQC)
  page.makeValueBinding(surfaceElements.channelControls[7].rec_button.mSurfaceValue, selectedTrackChannel.mValue.mRecordEnable).setTypeToggle().setSubPage(subPageSendsQC)

  // EQ Related but on Sends page so you know EQ activated...not sure the best option but hey, more buttons and lights is cool!
  page.makeValueBinding(surfaceElements.channelControls[0].solo_button.mSurfaceValue, selectedTrackChannel.mChannelEQ.mBand1.mOn).setTypeToggle().setSubPage(subPageSendsQC)
  page.makeValueBinding(surfaceElements.channelControls[1].solo_button.mSurfaceValue, selectedTrackChannel.mChannelEQ.mBand2.mOn).setTypeToggle().setSubPage(subPageSendsQC)
  page.makeValueBinding(surfaceElements.channelControls[2].solo_button.mSurfaceValue, selectedTrackChannel.mChannelEQ.mBand3.mOn).setTypeToggle().setSubPage(subPageSendsQC)
  page.makeValueBinding(surfaceElements.channelControls[3].solo_button.mSurfaceValue, selectedTrackChannel.mChannelEQ.mBand4.mOn).setTypeToggle().setSubPage(subPageSendsQC)

  page.makeActionBinding(surfaceElements.channelControls[0].rec_button.mSurfaceValue, subPageSendsQC.mAction.mActivate).setSubPage(subPageSendsQC)
  page.makeActionBinding(surfaceElements.channelControls[1].rec_button.mSurfaceValue, subPageEQ.mAction.mActivate).setSubPage(subPageSendsQC)
  page.makeActionBinding(surfaceElements.channelControls[2].rec_button.mSurfaceValue, subPagePreFilter.mAction.mActivate).setSubPage(subPageSendsQC)
  page.makeActionBinding(surfaceElements.channelControls[3].rec_button.mSurfaceValue, subPageCueSends.mAction.mActivate).setSubPage(subPageSendsQC)

  // EQ Subpage
  const eqBand = []
  eqBand[0] = selectedTrackChannel.mChannelEQ.mBand1
  eqBand[1] = selectedTrackChannel.mChannelEQ.mBand2
  eqBand[2] = selectedTrackChannel.mChannelEQ.mBand3
  eqBand[3] = selectedTrackChannel.mChannelEQ.mBand4
  for (var idx = 0; idx < 4; ++idx) {
      var knobSurfaceValue = surfaceElements.channelControls[idx].pushEncoder.mEncoderValue;
      var knob2SurfaceValue = surfaceElements.channelControls[idx + 4].pushEncoder.mEncoderValue;
      var knobPushValue = surfaceElements.channelControls[idx].pushEncoder.mPushValue;
      var knob2PushValue = surfaceElements.channelControls[idx + 4].pushEncoder.mPushValue;
      var faderSurfaceValue = surfaceElements.channelControls[idx].fader.mSurfaceValue;
      var fader2SurfaceValue = surfaceElements.channelControls[idx + 4].fader.mSurfaceValue;

      page.makeValueBinding(knobSurfaceValue, eqBand[idx].mFilterType).setSubPage(subPageEQ)
      page.makeValueBinding(knob2SurfaceValue, eqBand[idx].mQ).setSubPage(subPageEQ)
      page.makeValueBinding(knobPushValue, eqBand[idx].mOn).setTypeToggle().setSubPage(subPageEQ)
      page.makeValueBinding(knob2PushValue, eqBand[idx].mOn).setTypeToggle().setSubPage(subPageEQ)
      page.makeValueBinding(faderSurfaceValue, eqBand[idx].mGain).setSubPage(subPageEQ)
      page.makeValueBinding(fader2SurfaceValue, eqBand[idx].mFreq).setSubPage(subPageEQ)
  }

  /// CueSends subPage
  for (var idx = 0; idx < selectedTrackChannel.mCueSends.getSize(); ++idx) {
      var knobSurfaceValue = surfaceElements.channelControls[idx].pushEncoder.mEncoderValue;
      var knobPushValue = surfaceElements.channelControls[idx].pushEncoder.mPushValue;
      var faderSurfaceValue = surfaceElements.channelControls[idx].fader.mSurfaceValue;

      page.makeValueBinding(knobSurfaceValue, selectedTrackChannel.mCueSends.getByIndex(idx).mPan).setSubPage(subPageCueSends)
      page.makeValueBinding(knobPushValue, selectedTrackChannel.mCueSends.getByIndex(idx).mOn).setTypeToggle().setSubPage(subPageCueSends)
      page.makeValueBinding(faderSurfaceValue, selectedTrackChannel.mCueSends.getByIndex(idx).mLevel).setSubPage(subPageCueSends)

      page.makeValueBinding(surfaceElements.channelControls[idx].sel_button.mSurfaceValue, selectedTrackChannel.mCueSends.getByIndex(idx).mOn).setTypeToggle().setSubPage(subPageCueSends)
      page.makeValueBinding(surfaceElements.channelControls[idx].mute_button.mSurfaceValue, selectedTrackChannel.mCueSends.getByIndex(idx).mPrePost).setTypeToggle().setSubPage(subPageCueSends)
  }

  // PreFilter subPage
  var knobSurfaceValue = surfaceElements.channelControls[0].pushEncoder.mEncoderValue;
  var knob2SurfaceValue = surfaceElements.channelControls[1].pushEncoder.mEncoderValue;
  var knob3SurfaceValue = surfaceElements.channelControls[2].pushEncoder.mEncoderValue;

  var knobPushValue = surfaceElements.channelControls[0].pushEncoder.mPushValue;
  var knob2PushValue = surfaceElements.channelControls[1].pushEncoder.mPushValue;
  var knob3PushValue = surfaceElements.channelControls[2].pushEncoder.mPushValue;

  var faderSurfaceValue = surfaceElements.channelControls[0].fader.mSurfaceValue;
  var fader2SurfaceValue = surfaceElements.channelControls[1].fader.mSurfaceValue;
  var fader3SurfaceValue = surfaceElements.channelControls[2].fader.mSurfaceValue;

  var preFilter = selectedTrackChannel.mPreFilter

  page.makeValueBinding(surfaceElements.channelControls[0].sel_button.mSurfaceValue, preFilter.mBypass).setTypeToggle().setSubPage(subPagePreFilter)
  page.makeValueBinding(surfaceElements.channelControls[0].mute_button.mSurfaceValue, preFilter.mPhaseSwitch).setTypeToggle().setSubPage(subPagePreFilter)

  page.makeValueBinding(surfaceElements.channelControls[1].sel_button.mSurfaceValue, preFilter.mHighCutOn).setTypeToggle().setSubPage(subPagePreFilter)
  page.makeValueBinding(surfaceElements.channelControls[2].sel_button.mSurfaceValue, preFilter.mLowCutOn).setTypeToggle().setSubPage(subPagePreFilter)

  page.makeValueBinding(knob2SurfaceValue, preFilter.mHighCutSlope).setSubPage(subPagePreFilter)
  page.makeValueBinding(knob3SurfaceValue, preFilter.mLowCutSlope).setSubPage(subPagePreFilter)
  page.makeValueBinding(knobPushValue, preFilter.mBypass).setTypeToggle().setSubPage(subPagePreFilter)
  page.makeValueBinding(knob2PushValue, preFilter.mHighCutOn).setTypeToggle().setSubPage(subPagePreFilter)
  page.makeValueBinding(knob3PushValue, preFilter.mLowCutOn).setTypeToggle().setSubPage(subPagePreFilter)
  page.makeValueBinding(faderSurfaceValue, preFilter.mGain).setSubPage(subPagePreFilter)
  page.makeValueBinding(fader2SurfaceValue, preFilter.mHighCutFreq).setSubPage(subPagePreFilter)
  page.makeValueBinding(fader3SurfaceValue, preFilter.mLowCutFreq).setSubPage(subPagePreFilter)

  page.mOnActivate = function (/** @type {MR_ActiveDevice} */activeDevice) {
      // console.log('from script: Platform M+ page "Selected Track" activated')
      activeDevice.setState("activePage", "SelectedTrack")
      activeDevice.setState("activeSubPage", "SendsQC")
      clearAllLeds(activeDevice, midiOutput)
      clearChannelState(activeDevice)
      // Set the Rec leds which correspond to the different subages to their starting state
      midiOutput.sendMidi(activeDevice, [0x90, 0, 127])
      midiOutput.sendMidi(activeDevice, [0x90, 1, 0])
      midiOutput.sendMidi(activeDevice, [0x90, 2, 0])
      midiOutput.sendMidi(activeDevice, [0x90, 3, 0])
  }

  return page
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

function makePageChannelStrip() {
  var page = makePageWithDefaults('ChannelStrip', surfaceElements, deviceDriver, midiOutput)

  var strip = page.makeSubPageArea('Strip')
  var gatePage = makeSubPage(strip, 'Gate')
  var compressorPage = makeSubPage(strip, 'Compressor')
  var toolsPage = makeSubPage(strip, 'Tools')
  var saturatorPage = makeSubPage(strip, 'Saturator')
  var limiterPage = makeSubPage(strip, 'Limiter')


  var selectedTrackChannel = page.mHostAccess.mTrackSelection.mMixerChannel
  var stripEffects = selectedTrackChannel.mInsertAndStripEffects.mStripEffects

  for (var idx = 0; idx < surfaceElements.numStrips; ++idx) {
      var faderSurfaceValue = surfaceElements.channelControls[idx].fader.mSurfaceValue;

      var gate = stripEffects.mGate.mParameterBankZone.makeParameterValue()
      var compressor = stripEffects.mCompressor.mParameterBankZone.makeParameterValue()
      var tools = stripEffects.mTools.mParameterBankZone.makeParameterValue()
      var saturator = stripEffects.mSaturator.mParameterBankZone.makeParameterValue()
      var limiter = stripEffects.mLimiter.mParameterBankZone.makeParameterValue()

      for (var i = 0; i < 2; i++) { // ! Workaround for Cubase 12.0.60+ bug
          page.makeValueBinding(faderSurfaceValue, gate).setSubPage(gatePage)
          page.makeValueBinding(faderSurfaceValue, compressor).setSubPage(compressorPage)
          page.makeValueBinding(faderSurfaceValue, tools).setSubPage(toolsPage)
          page.makeValueBinding(faderSurfaceValue, saturator).setSubPage(saturatorPage)
          page.makeValueBinding(faderSurfaceValue, limiter).setSubPage(limiterPage)
      }
  }

  for (var idx = 0; idx < 5; ++idx) {
      var faderStrip = surfaceElements.channelControls[idx]
      var type = ['mGate', 'mCompressor', 'mTools', 'mSaturator', 'mLimiter'][idx]
      for (var i = 0; i < 2; i++) { // ! Workaround for Cubase 12.0.60+ bug
          page.makeValueBinding(faderStrip.rec_button.mSurfaceValue, stripEffects[type].mOn).setTypeToggle()
          page.makeValueBinding(faderStrip.mute_button.mSurfaceValue, stripEffects[type].mBypass).setTypeToggle()
      }
  }

  page.makeActionBinding(surfaceElements.channelControls[0].sel_button.mSurfaceValue, gatePage.mAction.mActivate)
  page.makeActionBinding(surfaceElements.channelControls[1].sel_button.mSurfaceValue, compressorPage.mAction.mActivate)
  page.makeActionBinding(surfaceElements.channelControls[2].sel_button.mSurfaceValue, toolsPage.mAction.mActivate)
  page.makeActionBinding(surfaceElements.channelControls[3].sel_button.mSurfaceValue, saturatorPage.mAction.mActivate)
  page.makeActionBinding(surfaceElements.channelControls[4].sel_button.mSurfaceValue, limiterPage.mAction.mActivate)

  page.mOnActivate = function (activeDevice: MR_ActiveDevice) {
      // console.log('from script: Platform M+ page "Channel Strip" activated')
      activeDevice.setState("activePage", "ChannelStrip")
      activeDevice.setState("activeSubPage", "Gate")
      clearAllLeds(activeDevice, midiOutput)
      clearChannelState(activeDevice)
      midiOutput.sendMidi(activeDevice, [0x90, 24, 127])
      midiOutput.sendMidi(activeDevice, [0x90, 25, 0])
      midiOutput.sendMidi(activeDevice, [0x90, 26, 0])
      midiOutput.sendMidi(activeDevice, [0x90, 27, 0])
      midiOutput.sendMidi(activeDevice, [0x90, 28, 0])
  }

//     page.mOnIdle = function(activeDevice, activeMapping) {
//         var now = Date.now()
//         var lastTime = Number(activeDevice.getState('lastTime'))
//         if ((now-lastTime) >= 5000) {
//             activeDevice.setState('lastTime', now.toString())
//             console.log('PAGE Default ON IDLE A')
//         } else {
// // WIP Okay so need to decide what to do here.
// // WIP And what about making MIXER a SHIFT key?
//         }
//         // Your custom idle-time tasks here
//     }

  return page
}