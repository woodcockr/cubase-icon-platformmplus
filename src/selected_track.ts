import { clearAllLeds } from "./icon_elements";
import { makePageWithDefaults } from "./master_controls"
import { SurfaceElements, Helper_updateDisplay } from "./icon_elements"
import { setTextOfColumn, setTextOfLine, makeLabel } from "./helper"

export function makePage(surfaceElements: SurfaceElements, deviceDriver: MR_DeviceDriver, midiOutput: MR_DeviceMidiOutput) {
  var page = makePageWithDefaults('Selected Channel', surfaceElements, deviceDriver, midiOutput)

  var faderSubPageArea = page.makeSubPageArea('Faders')
  var subPageSendsQC = faderSubPageArea.makeSubPage('SendsQC')
  var subPageEQ = faderSubPageArea.makeSubPage('EQ')
  var subPageCueSends = faderSubPageArea.makeSubPage('CueSends')
  var subPagePreFilter = faderSubPageArea.makeSubPage('PreFilter')

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
      // WIP clearChannelState(activeDevice)
      // Set the Rec leds which correspond to the different subages to their starting state
      midiOutput.sendMidi(activeDevice, [0x90, 0, 127])
      midiOutput.sendMidi(activeDevice, [0x90, 1, 0])
      midiOutput.sendMidi(activeDevice, [0x90, 2, 0])
      midiOutput.sendMidi(activeDevice, [0x90, 3, 0])
  }

  return page
}