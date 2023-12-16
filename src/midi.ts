import { makePageWithDefaults } from "./master_controls"
import { IconPlatformMplus } from "./icon_elements"
import { GlobalBooleanVariables } from "./midi/binding"
import { ActivationCallbacks } from "./midi/connection"
import { LcdManager } from "./midi/LcdManager";

// import { midi_cc } from "./config"; // TODO Why doesn't this appear to work?

export function makePage(device: IconPlatformMplus, deviceDriver: MR_DeviceDriver, globalBooleanVariables: GlobalBooleanVariables, activationCallbacks: ActivationCallbacks) {
  var page = makePageWithDefaults('Midi', device, deviceDriver, globalBooleanVariables, activationCallbacks)
  const midi_cc = [
    { title: "Mod wheel", cc: 1 },
    { title: "Expression", cc: 11 },
    { title: "Breath Ctrl", cc: 2 },
    { title: "CC16", cc: 16 },
    { title: "CC17", cc: 17 },
    { title: "CC18", cc: 18 },
    { title: "CC19", cc: 19 },
    { title: "CC20", cc: 20 },
  ]
  function makeMidiCCBinding(page: MR_FactoryMappingPage, displayName: string, cc: number, fader: number) {
    // ? I have no idea what page.mCustom.makeHostValueVariable actually does- all I know is I can make a value binding this way. I can't seem to be able to look it up
    // ? or access it all once made.
    page.makeValueBinding(device.channelControls[fader].fader.mSurfaceValue, page.mCustom.makeHostValueVariable(displayName)).setValueTakeOverModeJump()
      .mOnValueChange = (activeDevice: MR_ActiveDevice, mapping: any, value: number, value2: any) => {
        // console.log(displayName + ":" + mapping + "::" + value + "::" + value2)
        //   var display = JSON.parse(activeDevice.getState('display'))
        var ccValue = Math.ceil(value * 127)
        var pitchBendValue = Math.ceil(value * 16383)
        var val1 = pitchBendValue % 128
        var val2 = Math.floor(pitchBendValue / 128)

        // this is the value going back to the icon Fader
        device.channelControls[fader].fader.mSurfaceValue.setProcessValue(activeDevice, value);
        // this is the value going back to Cubendo
        device.ccPortPair.output.sendMidi(activeDevice, [0xB0, cc, ccValue])
        // Update display
        device.lcdManager.setChannelText(activeDevice, 1, fader, displayName);
        device.lcdManager.setChannelText(activeDevice, 0, fader, ccValue.toString());
      }
  }

  for (var i = 0; i < device.numStrips; ++i) {
    let name = LcdManager.centerString(
      LcdManager.abbreviateString(LcdManager.stripNonAsciiCharacters(midi_cc[i].title))
    )
    makeMidiCCBinding(page, name, midi_cc[i].cc, i)
  }

  page.mOnActivate = (context: MR_ActiveDevice) => {
    console.log('from script: Platform M+ page "Midi" activated')
    // TODO Difficult to know how to handle fader updates which trigger CC changes
    // globalBooleanVariables.areMotorsActive.set(context, true) // Disable fader movement in midi mode - otherwise faders will reset and send initial values since Cubase doesn't send CC values.

    // TODO This fails on activate due to overwrite from faders! thankfully the valueBinding doesn't. Looks like the scribble strip updates when the faders are deactivated occur
    // TODO after the mOnActivate call thus wiping this out.
    for (var i = 0; i < device.numStrips; ++i) {
      let name = LcdManager.centerString(
        LcdManager.abbreviateString(LcdManager.stripNonAsciiCharacters(midi_cc[i].title))
      )
      device.lcdManager.setChannelText(context, 1, i, name);
      device.lcdManager.setChannelText(context, 0, i, "?");
    }

  }
  page.mOnDeactivate = (context: MR_ActiveDevice) => {
    console.log('from script: Platform M+ page "Midi" deactivated')
    // TODO Difficult to know how to handle fader updates which trigger CC changes
    // globalBooleanVariables.areMotorsActive.set(context, false) // Disable fader movement in midi mode - otherwise faders will reset and send initial values since Cubase doesn't send CC values.
  }
  return page
}