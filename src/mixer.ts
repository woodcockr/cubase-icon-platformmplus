import { clearAllLeds } from "./icon_elements";
import { makePageWithDefaults } from "./master_controls"
import { SurfaceElements } from "./icon_elements"

export function makePage(surfaceElements: SurfaceElements, deviceDriver: MR_DeviceDriver, midiOutput: MR_DeviceMidiOutput) {
  var page = makePageWithDefaults('Mixer', surfaceElements, deviceDriver, midiOutput)

  var FaderSubPageArea = page.makeSubPageArea('FadersKnobs')
  var subPageFaderVolume = FaderSubPageArea.makeSubPage('Volume')

  var ButtonSubPageArea = page.makeSubPageArea('Buttons')
  var subPageButtonDefaultSet = ButtonSubPageArea.makeSubPage('DefaultSet')

  var hostMixerBankZone = page.mHostAccess.mMixConsole.makeMixerBankZone("AudioInstrBanks")
      .setFollowVisibility(true)

  for (var channelIndex = 0; channelIndex < surfaceElements.numStrips; ++channelIndex) {
      var hostMixerBankChannel = hostMixerBankZone.makeMixerBankChannel()

      var knobSurfaceValue = surfaceElements.channelControls[channelIndex].pushEncoder.mEncoderValue;
      var knobPushValue = surfaceElements.channelControls[channelIndex].pushEncoder.mPushValue;
      var faderSurfaceValue = surfaceElements.channelControls[channelIndex].fader.mSurfaceValue;
      var faderTouchValue = surfaceElements.channelControls[channelIndex].fader_touch;
      var sel_buttonSurfaceValue = surfaceElements.channelControls[channelIndex].sel_button.mSurfaceValue;
      var mute_buttonSurfaceValue = surfaceElements.channelControls[channelIndex].mute_button.mSurfaceValue;
      var solo_buttonSurfaceValue = surfaceElements.channelControls[channelIndex].solo_button.mSurfaceValue;
      var rec_buttonSurfaceValue = surfaceElements.channelControls[channelIndex].rec_button.mSurfaceValue;

      // FaderKnobs - Volume, Pan, Editor Open
      page.makeValueBinding(knobSurfaceValue, hostMixerBankChannel.mValue.mPan).setSubPage(subPageFaderVolume)
      page.makeValueBinding(knobPushValue, hostMixerBankChannel.mValue.mEditorOpen).setTypeToggle().setSubPage(subPageFaderVolume)
      page.makeValueBinding(faderSurfaceValue, hostMixerBankChannel.mValue.mVolume).setValueTakeOverModeJump().setSubPage(subPageFaderVolume)
      page.makeValueBinding(faderSurfaceValue, hostMixerBankChannel.mValue.mVolume).setValueTakeOverModeJump().setSubPage(subPageFaderVolume) // ! Duplicate to overcome C12.0.60+ bug
      page.makeValueBinding(sel_buttonSurfaceValue, hostMixerBankChannel.mValue.mSelected).setTypeToggle().setSubPage(subPageButtonDefaultSet)
      page.makeValueBinding(mute_buttonSurfaceValue, hostMixerBankChannel.mValue.mMute).setTypeToggle().setSubPage(subPageButtonDefaultSet)
      page.makeValueBinding(solo_buttonSurfaceValue, hostMixerBankChannel.mValue.mSolo).setTypeToggle().setSubPage(subPageButtonDefaultSet)
      page.makeValueBinding(rec_buttonSurfaceValue, hostMixerBankChannel.mValue.mRecordEnable).setTypeToggle().setSubPage(subPageButtonDefaultSet)

  }

  page.mOnActivate = function (activeDevice: MR_ActiveDevice) {
      console.log('from script: Platform M+ page "Mixer" activated')
      clearAllLeds(activeDevice, midiOutput)
  }

  return page
}