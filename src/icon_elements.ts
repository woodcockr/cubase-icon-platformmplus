var helper = require('./helper')
var makeLabel = helper.makeLabel
var setTextOfColumn = helper.setTextOfColumn
var setTextOfLine = helper.setTextOfLine

export interface SurfaceElements {
  d2Display: MR_BlindPanel,
  numStrips: number,
  channelControls: Array<ChannelControl>,
  faderMaster: MasterControl,
  transport: TransportControl,
  selectedTrack: MR_SurfaceCustomValueVariable
}

export interface ChannelControl {
  surface: MR_DeviceSurface,
  midiInput: MR_DeviceMidiInput,
  midiOutput: MR_DeviceMidiOutput,
  instance: number,
  pushEncoder: MR_PushEncoder,
  fader: MR_Fader,
  fader_touch: MR_SurfaceCustomValueVariable,
  sel_button: MR_Button,
  mute_button: MR_Button,
  solo_button: MR_Button,
  rec_button: MR_Button
}

export interface MasterControl {
  surface: MR_DeviceSurface,
  midiInput: MR_DeviceMidiInput,
  midiOutput: MR_DeviceMidiOutput,
  instance: number,
  fader: MR_Fader,
  fader_touch: MR_SurfaceCustomValueVariable,
  mixer_button: MR_Button,
  read_button: MR_Button,
  write_button: MR_Button,
}

export interface TransportControl {
  surface: MR_DeviceSurface,
  midiInput: MR_DeviceMidiInput,
  midiOutput: MR_DeviceMidiOutput,
  prevChn: MR_Button,
  nextChn: MR_Button,
  prevBnk: MR_Button,
  nextBnk: MR_Button,
  btnRewind: MR_Button,
  btnForward: MR_Button,
  btnStop: MR_Button,
  btnStart: MR_Button,
  btnRecord: MR_Button,
  btnCycle: MR_Button,
  btnFlip: MR_Button,
  btnZoomOnOff: MR_Button,
  jog_wheel: MR_PushEncoder,
  jogLeftVariable: MR_SurfaceCustomValueVariable,
  jogRightVariable: MR_SurfaceCustomValueVariable,
  zoomVertOut: MR_Button,
  zoomVertIn: MR_Button,
  zoomHorizOut: MR_Button,
  zoomHorizIn: MR_Button,
}

function _sendDisplayData(row: number, text: string, activeDevice: MR_ActiveDevice, midiOutput: MR_DeviceMidiOutput) {
  var lenText = text.length < 56 ? text.length : 56
  var data = [0xf0, 0x00, 0x00, 0x66, 0x14, 0x12]
  var out = data.concat(56 * row) // Row 1 offset

  for (var i = 0; i < lenText; ++i)
    out.push(text.charCodeAt(i))
  while (lenText++ < 56)
    out.push(0x20) // spaces for the rest
  out.push(0xf7)
  midiOutput.sendMidi(activeDevice, out)

}

export function Helper_updateDisplay(idRow1: string, idRow2: string, idAltRow1: string, idAltRow2: string, activeDevice: MR_ActiveDevice, midiOutput: MR_DeviceMidiOutput) {
  // console.log("Helper Update Display")
  // Display ids
  activeDevice.setState('Display - idRow1', idRow1)
  activeDevice.setState('Display - idRow2', idRow2)
  activeDevice.setState('Display - idAltRow1', idAltRow1)
  activeDevice.setState('Display - idAltRow2', idAltRow2)
  // console.log("Display ids update: " + idRow1+"::"+idRow2)
  // console.log("Display ids update: " + idAltRow1+"::"+idAltRow2)
  // New display values
  var newRow1 = activeDevice.getState(idRow1)
  var newRow2 = activeDevice.getState(idRow2)
  var newAltRow1 = activeDevice.getState(idAltRow1)
  var newAltRow2 = activeDevice.getState(idAltRow2)
  // Previous values
  var prevRow1 = activeDevice.getState('Row1')
  var prevRow2 = activeDevice.getState('Row2')
  var prevAltRow1 = activeDevice.getState('AltRow1')
  var prevAltRow2 = activeDevice.getState('AltRow2')
  var activeDisplayType = activeDevice.getState('activeDisplayType')
  // Display Fader or Panner values
  var displayType = activeDevice.getState("displayType")

  if (displayType === "Pan") {
    // Update display if it has changed
    if ((newAltRow1 !== prevAltRow1) || (newAltRow2 !== prevAltRow2) || (activeDisplayType !== displayType)) {
      // console.log("AltRows Display prev: " + prevAltRow1+"::"+prevAltRow2)
      // console.log("AltRows Display new: " + newAltRow1+"::"+newAltRow2)
      _sendDisplayData(1, newAltRow1, activeDevice, midiOutput)
      _sendDisplayData(0, newAltRow2, activeDevice, midiOutput)
    }
  } else {
    // Update display if it has changed
    if ((newRow1 !== prevRow1) || (newRow2 !== prevRow2) || (activeDisplayType !== displayType)) {
      // console.log("Rows Display prev" + prevRow1+"::"+prevRow2)
      // console.log("Rows Display new" + newRow1+"::"+newRow2)
      _sendDisplayData(1, newRow1, activeDevice, midiOutput)
      _sendDisplayData(0, newRow2, activeDevice, midiOutput)
    }
  }
  // Update Active display state
  activeDevice.setState('Row1', newRow1)
  activeDevice.setState('Row2', newRow2)

  activeDevice.setState('AltRow1', newAltRow1)
  activeDevice.setState('AltRow2', newAltRow2)

  activeDevice.setState('activeDisplayType', displayType)
  // console.log("Helper Update Display...DONE")

  // Indicators for the Zoom and Jog function subpages
  function display_indicator(row: number, indicator: string) {
    var data = [0xf0, 0x00, 0x00, 0x66, 0x14, 0x12,
    ]
    if (row === 0) {
      data.push(55)
    } else {
      data.push(111)
    }
    data.push(indicator.charCodeAt(0))
    data.push(0xf7)
    midiOutput.sendMidi(activeDevice, data)
  }

  var indicator1 = activeDevice.getState("indicator1")
  var indicator2 = activeDevice.getState("indicator2")

  display_indicator(1, indicator1)
  display_indicator(0, indicator2)
}


export function makeLedButton(surface: MR_DeviceSurface, midiInput: MR_DeviceMidiInput, midiOutput: MR_DeviceMidiOutput, note: number, x: number, y: number, w: number, h: number, circle: boolean) {
  var button = surface.makeButton(x, y, w, h)
  button.mSurfaceValue.mMidiBinding.setIsConsuming(true).setInputPort(midiInput).bindToNote(0, note)
  if (circle) {
    button.setShapeCircle()
  }
  button.mSurfaceValue.mOnProcessValueChange = (activeDevice: MR_ActiveDevice) => {
    // console.log("LedButton ProcessValue Change:"+button.mSurfaceValue.getProcessValue(activeDevice))
    var value = button.mSurfaceValue.getProcessValue(activeDevice)

    midiOutput.sendMidi(activeDevice, [0x90, note, value])
  }
  return button
}

export function clearAllLeds(activeDevice: MR_ActiveDevice, midiOutput: MR_DeviceMidiOutput) {
  // console.log('Clear All Leds')
  // Mixer buttons
  for (var i = 0; i < 8; ++i) {
    midiOutput.sendMidi(activeDevice, [0x90, 24 + i, 0])
    midiOutput.sendMidi(activeDevice, [0x90, 16 + i, 0])
    midiOutput.sendMidi(activeDevice, [0x90, 8 + i, 0])
    midiOutput.sendMidi(activeDevice, [0x90, 0 + i, 0])
  }
  // Master Fader buttons
  midiOutput.sendMidi(activeDevice, [0x90, 84, 0]) // Mixer
  midiOutput.sendMidi(activeDevice, [0x90, 74, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 75, 0])

  // Transport Buttons
  midiOutput.sendMidi(activeDevice, [0x90, 48, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 49, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 46, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 47, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 91, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 92, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 93, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 94, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 95, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 86, 0])

}

export function makeTouchFader(surface: MR_DeviceSurface, midiInput: MR_DeviceMidiInput, midiOutput: MR_DeviceMidiOutput, channel: number, x: number, y: number, w: number, h: number) {
  // Fader + Fader Touch
  var fader = surface.makeFader(x, y, w, h).setTypeVertical()
  fader.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .setOutputPort(midiOutput)
    .bindToPitchBend(channel)

  // !!! Important !!!
  // Test for the existing TouchState feature
  // to make the script compatible with Cubase 12 as well
  // create a custom value variable to bind agains the touch state midi message
  var fader_touch = surface.makeCustomValueVariable('faderTouch' + channel.toString())

  if (fader.mSurfaceValue.mTouchState) {
    fader_touch.mMidiBinding.setInputPort(midiInput).bindToNote(0, 104 + channel)
    // bind the custom value variable to the TouchState member. (new in API 1.1)
    fader.mSurfaceValue.mTouchState.bindTo(fader_touch)
  }

  return { fader: fader, fader_touch: fader_touch }
}

function repeatCommand(activeDevice: MR_ActiveDevice, command: MR_SurfaceCustomValueVariable, repeats: number) {
  for (var i = 0; i < repeats; i++) {
    command.setProcessValue(activeDevice, 1)
  }
}

export function bindCommandKnob(pushEncoder: MR_SurfaceElementValue, commandIncrease: MR_SurfaceCustomValueVariable, commandDecrease: MR_SurfaceCustomValueVariable) {
  // console.log('from script: createCommandKnob')
  pushEncoder.mOnProcessValueChange = function (activeDevice, value) {
    // console.log('value changed: ' + value)
    if (value < 0.5) {
      var jump_rate = Math.floor(value * 127)
      repeatCommand(activeDevice, commandIncrease, jump_rate)
    } else if (value > 0.5) {
      var jump_rate = Math.floor((value - 0.5) * 127)
      repeatCommand(activeDevice, commandDecrease, jump_rate)
    }
  }
}

export function makeChannelControl(surface: MR_DeviceSurface, midiInput: MR_DeviceMidiInput, midiOutput: MR_DeviceMidiOutput, x: number, y: number, instance: number): ChannelControl {
  x = x + 7 * instance; // Position fader based on instance number.

  // Pot encoder
  const pushEncoder = surface.makePushEncoder(x, y + 2, 4, 4)

  pushEncoder.mEncoderValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToControlChange(0, 16 + instance)
    .setTypeRelativeSignedBit()

  pushEncoder.mPushValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToNote(0, 32 + instance);

  // Fader + Fader Touch
  const fader_x = x
  const fader_y = y + 7
  const tf = makeTouchFader(surface, midiInput, midiOutput, instance, fader_x, fader_y, 3, 18)
  const fader = tf.fader
  const fader_touch = tf.fader_touch

  // Channel Buttons
  const sel_button = makeLedButton(surface, midiInput, midiOutput, 24 + instance, fader_x + 4, fader_y + 6, 3, 3, false)
  const mute_button = makeLedButton(surface, midiInput, midiOutput, 16 + instance, fader_x + 4, fader_y + 9, 3, 3, false)
  const solo_button = makeLedButton(surface, midiInput, midiOutput, 8 + instance, fader_x + 4, fader_y + 12, 3, 3, false)
  const rec_button = makeLedButton(surface, midiInput, midiOutput, 0 + instance, fader_x + 4, fader_y + 15, 3, 3, true)

  var channelIndex = instance
  // WIP Refactor the fader updates to use the new state stuff.
  fader.mSurfaceValue.mOnTitleChange = (function (activeDevice: MR_ActiveDevice, objectTitle: string, valueTitle: string) {
    // console.log("Fader Title Change: " + this.channelIndex + "::" + objectTitle + ":" + valueTitle)
    var activePage = activeDevice.getState("activePage")
    var activeSubPage = activeDevice.getState("activeSubPage")
    var faderTitles = activeDevice.getState(activePage + "- " + activeSubPage + ' - Fader - Title')
    var faderValueTitles = activeDevice.getState(activePage + "- " + activeSubPage + ' - Fader - ValueTitles')
    // console.log("Fader Title Change Page: " + activePage + "::" + activeSubPage)
    switch (activePage) {
      case "Midi":
        // MIDI Page is special since it uses a separate midi port and completely separate display and MIDI routing setup
        // This update of the display is simply to ensure that should this event be received (which it is during init for example) then
        // the Midi display state values won't be overwritten as they are handed by the custom onValueChange call in the page
        Helper_updateDisplay(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', activePage + "- " + activeSubPage + ' - Fader - Values', activePage + "- " + activeSubPage + ' - Pan - ValueTitles', activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, this.midiOutput)
        break;
      case "ChannelStrip":
      case "SelectedTrack":
        activeDevice.setState(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', setTextOfColumn(this.channelIndex, makeLabel(valueTitle, 6), faderValueTitles))
        Helper_updateDisplay(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', activePage + "- " + activeSubPage + ' - Fader - Values', activePage + "- " + activeSubPage + ' - Pan - ValueTitles', activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, this.midiOutput)
        break;
      default:
        activeDevice.setState(activePage + "- " + activeSubPage + ' - Fader - Title', setTextOfColumn(this.channelIndex, makeLabel(objectTitle, 6), faderTitles))
        activeDevice.setState(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', setTextOfColumn(this.channelIndex, makeLabel(valueTitle, 6), faderValueTitles))
        Helper_updateDisplay(activePage + "- " + activeSubPage + ' - Fader - Title', activePage + "- " + activeSubPage + ' - Fader - Values', activePage + "- " + activeSubPage + ' - Pan - Title', activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, this.midiOutput)
        break;
    }
  }).bind({ channelIndex, midiOutput })

  fader.mSurfaceValue.mOnDisplayValueChange = (function (activeDevice: MR_ActiveDevice, value: string, units: string) {
    var activePage = activeDevice.getState("activePage")
    var activeSubPage = activeDevice.getState("activeSubPage")
    var faderValues = activeDevice.getState(activePage + "- " + activeSubPage + ' - Fader - Values')

    // console.log("Fader Display Value Change: " + value + ":" + activePage)

    // ? When adjusting the AI fader in Mixer mode there is no update to the other fader even if you adjust that fader with the AI control
    // ? When adjusting the AI fader in SelectedChannel mode there IS an update to the other fader, so...
    // ! Disable the update if the display in on MasterFader
    if (activeDevice.getState('Display - idRow1') !== 'MasterFader - Title') {
      switch (activePage) {
        case "Midi":
          break;
        default:
          activeDevice.setState(activePage + "- " + activeSubPage + ' - Fader - Values', setTextOfColumn(channelIndex, makeLabel(value, 6), faderValues))
          Helper_updateDisplay(activeDevice.getState('Display - idRow1'), activePage + "- " + activeSubPage + ' - Fader - Values', activeDevice.getState('Display - idAltRow1'), activeDevice.getState('Display - idAltRow2'), activeDevice, midiOutput)
          break;
      }
    }

  }).bind({ midiOutput, channelIndex })

  pushEncoder.mEncoderValue.mOnTitleChange = (function (activeDevice: MR_ActiveDevice, objectTitle: string, valueTitle: string) {
    // console.log("Pan Title Changed:" + objectTitle + ":" + valueTitle)
    var activePage = activeDevice.getState("activePage")
    var activeSubPage = activeDevice.getState("activeSubPage")
    var panTitles = activeDevice.getState(activePage + "- " + activeSubPage + ' - Pan - Title')
    var panValueTitles = activeDevice.getState(activePage + "- " + activeSubPage + ' - Pan - ValueTitles')
    // WIP This switch logic needs refactoring - it is repeated (and thus error prone) for pushEncoder and fader mOnTileChange
    switch (activePage) {
      case "Midi":
        // MIDI Page is special since it uses a separate midi port and completely separate display and MIDI routing setup
        // This update of the display is simply to ensure that should this event be received (which it is during init for example) then
        // the Midi display state values won't be overwritten as they are handed by the custom onValueChange call in the page
        Helper_updateDisplay(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', activePage + "- " + activeSubPage + ' - Fader - Values', activePage + "- " + activeSubPage + ' - Pan - ValueTitles', activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, midiOutput)
        break;
      case "ChannelStrip":
      case "SelectedTrack":
        switch (activeSubPage) {
          case "SendsQC":
            var title = objectTitle.slice(2)
            if (title.length === 0) {
              title = "None"
            }
            activeDevice.setState(activePage + "- " + activeSubPage + ' - Pan - ValueTitles', setTextOfColumn(channelIndex, makeLabel(title, 6), panValueTitles))
            Helper_updateDisplay(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', activePage + "- " + activeSubPage + ' - Fader - Values', activePage + "- " + activeSubPage + ' - Pan - ValueTitles', activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, midiOutput)
            break;
          default:
            var title = valueTitle
            if (title.length === 0) {
              title = "None"
            }
            activeDevice.setState(activePage + "- " + activeSubPage + ' - Pan - ValueTitles', setTextOfColumn(channelIndex, makeLabel(title, 6), panValueTitles))
            Helper_updateDisplay(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', activePage + "- " + activeSubPage + ' - Fader - Values', activePage + "- " + activeSubPage + ' - Pan - ValueTitles', activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, midiOutput)
            break;
        }
        break;
      default:
        activeDevice.setState(activePage + "- " + activeSubPage + ' - Pan - Title', setTextOfColumn(channelIndex, makeLabel(objectTitle, 6), panTitles))
        activeDevice.setState(activePage + "- " + activeSubPage + ' - Pan - ValueTitles', setTextOfColumn(channelIndex, makeLabel(valueTitle, 6), panValueTitles))
        Helper_updateDisplay(activePage + "- " + activeSubPage + ' - Fader - Title', activePage + "- " + activeSubPage + ' - Fader - Values', activePage + "- " + activeSubPage + ' - Pan - Title', activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, midiOutput)
        break;
    }

  }).bind({ midiOutput, channelIndex })

  pushEncoder.mEncoderValue.mOnDisplayValueChange = (function (activeDevice: MR_ActiveDevice, value: string, units: string) {
    // console.log("Pan Value Change: " + value + ":" + units)
    var activePage = activeDevice.getState("activePage")
    var activeSubPage = activeDevice.getState("activeSubPage")
    var panValues = activeDevice.getState(activePage + "- " + activeSubPage + ' - Pan - Values')

    activeDevice.setState(activePage + "- " + activeSubPage + ' - Pan - Values', setTextOfColumn(channelIndex, makeLabel(value, 6), panValues))
    Helper_updateDisplay(activeDevice.getState('Display - idRow1'), activeDevice.getState('Display - idRow2'), activeDevice.getState('Display - idAltRow1'), activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, midiOutput)

  }).bind({ midiOutput, channelIndex })

  return {
    surface: surface,
    midiInput: midiInput,
    midiOutput: midiOutput,
    instance: instance, // Channel number, 1-8
    pushEncoder: pushEncoder,
    fader: fader,
    fader_touch: fader_touch,
    sel_button: sel_button,
    mute_button: mute_button,
    solo_button: solo_button,
    rec_button: rec_button,
  }

}

export function makeMasterControl(surface: MR_DeviceSurface, midiInput: MR_DeviceMidiInput, midiOutput: MR_DeviceMidiOutput, x: number, y: number, instance: number): MasterControl {
  x = x + 7 * instance;

  // Fader + Fader Touch
  const fader_x = x
  const fader_y = y + 3
  const tf = makeTouchFader(surface, midiInput, midiOutput, instance, fader_x, fader_y, 3, 18)
  const fader = tf.fader
  const fader_touch = tf.fader_touch

  fader.mSurfaceValue.mOnTitleChange = (function (activeDevice: MR_ActiveDevice, objectTitle: string, valueTitle: string) {
    console.log("Fader Title Change:" + objectTitle + ":" + valueTitle)
    var title = objectTitle ? objectTitle + ":" + valueTitle : "No AI Parameter under mouse"
    var master_fader = {
      title: title,
      value: ' ',
      display_stash: ''
    }
    activeDevice.setState('master_fader', JSON.stringify(master_fader))
  })

  fader.mSurfaceValue.mOnDisplayValueChange = function (activeDevice: MR_ActiveDevice, value: string, units: string ) {

    activeDevice.setState('MasterFader - Values', value + units)
    console.log("MasterFader Display Value Change: " + value + ":" + units)
    var master_fader = JSON.parse(activeDevice.getState('master_fader'))

    master_fader.value = value + ' ' + units
    var display = {
      row1: master_fader.title,
      row2: master_fader.value,
      indicator1: '',
      indicator2: ''
    }
    if (fader_touch.getProcessValue(activeDevice) === 1) {
      console.log("MasterFader Display update")
      updateDisplay(display, activeDevice, midiOutput)
    }
    activeDevice.setState('master_fader', JSON.stringify(master_fader))

  }

  fader_touch.mOnProcessValueChange = function (activeDevice: MR_ActiveDevice, touched: number, value2: number) {
    console.log("masterFader Touch Change: " + touched + ":" + value2)
    var display = JSON.parse(activeDevice.getState('display'))
    var master_fader = JSON.parse(activeDevice.getState('master_fader'))
    // value===-1 means touch released
    if (value2 == -1) {
      // Reset the display to previous values
      updateDisplay(master_fader.stash, activeDevice, midiOutput)
    } else {
      // Stash previous display state
      master_fader.stash = display
      display = {
        row1: master_fader.title,
        row2: master_fader.value,
        indicator1: '',
        indicator2: ''
      }
      updateDisplay(display, activeDevice, midiOutput)
    }
    activeDevice.setState('master_fader', JSON.stringify(master_fader))
  }

  // Channel Buttons
  const mixer_button = makeLedButton(surface, midiInput, midiOutput, 84, fader_x + 3, fader_y + 6, 3, 3, false)
  const read_button = makeLedButton(surface, midiInput, midiOutput, 74, fader_x + 3, fader_y + 9, 3, 3, false)
  const write_button = makeLedButton(surface, midiInput, midiOutput, 75, fader_x + 3, fader_y + 12, 3, 3, false)

  return {
    surface: surface,
    midiInput: midiInput,
    midiOutput: midiOutput,
    instance: instance,
    fader: fader,
    fader_touch: fader_touch,
    mixer_button: mixer_button,
    read_button: read_button,
    write_button: write_button,
  }
}

export function makeTransport(surface: MR_DeviceSurface, midiInput: MR_DeviceMidiInput, midiOutput: MR_DeviceMidiOutput, x: number, y: number): TransportControl {
  var w = 3
  var h = 3

  function bindMidiNote(button:MR_Button, chn: number, num: number) {
    button.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToNote(chn, num)
  }

  const prevChn = makeLedButton(surface, midiInput, midiOutput, 48, x, y, w, h, false)
  const nextChn = makeLedButton(surface, midiInput, midiOutput, 49, x + 3, y, w, h, false)

  const prevBnk = makeLedButton(surface, midiInput, midiOutput, 46, x, y + 3, w, h, false)
  const nextBnk = makeLedButton(surface, midiInput, midiOutput, 47, x + 3, y + 3, w, h, false)

  const btnRewind = makeLedButton(surface, midiInput, midiOutput, 91, x, y + 6, w, h, false)
  const btnForward = makeLedButton(surface, midiInput, midiOutput, 92, x + 3, y + 6, w, h, false)

  const btnStop = makeLedButton(surface, midiInput, midiOutput, 93, x + 3, y + 9, w, h, false)
  const btnStart = makeLedButton(surface, midiInput, midiOutput, 94, x, y + 9, w, h, false)

  const btnRecord = makeLedButton(surface, midiInput, midiOutput, 95, x, y + 12, w, h, false)
  const btnCycle = makeLedButton(surface, midiInput, midiOutput, 86, x + 3, y + 12, w, h, false)

  // The Note on/off events for the special functions are timestamped at the same time
  // cubase midi remote doesn't show anything on screen though a note is sent
  // Flip - Simultaneous press of Pre Chn+Pre Bank
  const btnFlip = surface.makeButton(x + 0.5, y + 15, 2, 2).setShapeCircle()
  bindMidiNote(btnFlip, 0, 50)

  // Pressing the Zoom keys simultaneously will toggle on and off a note event. If on
  // either zoom button will send a Note 100 when zoom is activated or deactivated by either button
  // If zoom is active and you simply press then other button the event will not be sent
  //
  const btnZoomOnOff = surface.makeButton(x + 3.5, y + 15, 2, 2).setShapeCircle()
  bindMidiNote(btnZoomOnOff, 0, 100)

  // The Jog wheel will change CC/Note based on which of thte Zoom buttons have been activated
  // None - CC 60
  // Vertical - Note Clockwise  97, CounterClockwise 96
  // Horizontal - Note Clockwise  99, CounterClockwise 98
  // The Jog wheel is an endless encoder but the surface Push Encoder is control value 0-127
  // In this case it pays to use the Absolute binding type as the Platform M+ produces a rate based
  // CC value - turn clockwise slowly -> 1, turn it rapidly -> 7 (counter clockwise values are offset by 50, turn CCW slowly -> 51)
  // In the Jog (or more correctly Nudge Cursor) mapping we use this to "tap the key severel times" - giving the impact of fine grain control if turned slowly
  // or large nudges if turned quickly.
  // ? One weird side effect of this is the Knob displayed in Cubase will show its "value" in a weird way.
  // todo I wonder if there is a way to change that behaviour?

  const jog_wheel = surface.makePushEncoder(x, y + 17, 6, 6)
  jog_wheel.mEncoderValue.mMidiBinding
    .setInputPort(midiInput)
    .setIsConsuming(true)
    .bindToControlChange(0, 60)
    .setTypeAbsolute()
  jog_wheel.mPushValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToNote(0, 101)
  // ? This is still passing midi events through. It's unclear how to stop the midi CC messages passing through other then removing the MIDI port from All In
  const jogLeftVariable = surface.makeCustomValueVariable('jogLeft')
  const jogRightVariable = surface.makeCustomValueVariable('jogRight')

  bindCommandKnob(jog_wheel.mEncoderValue, jogRightVariable, jogLeftVariable);

  //Zoom Vertical
  const zoomVertOut = surface.makeButton(x + 9, y + 8, 2, 2).setShapeCircle()
  bindMidiNote(zoomVertOut, 0, 96)
  const zoomVertIn = surface.makeButton(x + 11, y + 8, 2, 2).setShapeCircle()
  bindMidiNote(zoomVertIn, 0, 97)

  //Zoom Horizontal
  const zoomHorizOut = surface.makeButton(x + 9, y + 10, 2, 2).setShapeCircle()
  bindMidiNote(zoomHorizOut, 0, 98)
  const zoomHorizIn = surface.makeButton(x + 11, y + 10, 2, 2).setShapeCircle()
  bindMidiNote(zoomHorizIn, 0, 99)

  return {
    surface: surface,
    midiInput: midiInput,
    midiOutput: midiOutput,
    prevChn: prevChn,
    nextChn: nextChn,
    prevBnk: prevBnk,
    nextBnk: nextBnk,
    btnRewind: btnRewind,
    btnForward: btnForward,
    btnStop: btnStop,
    btnStart: btnStart,
    btnRecord: btnRecord,
    btnCycle: btnCycle,
    btnFlip: btnFlip,
    btnZoomOnOff: btnZoomOnOff,
    jog_wheel: jog_wheel,
    jogLeftVariable: jogLeftVariable,
    jogRightVariable: jogRightVariable,
    zoomVertOut: zoomVertOut,
    zoomVertIn: zoomVertIn,
    zoomHorizOut: zoomHorizOut,
    zoomHorizIn: zoomHorizIn,
  }
}

export function updateDisplay(new_display: { row1: any; row2: any; indicator1: any; indicator2: any },activeDevice: MR_ActiveDevice, midiOutput: MR_DeviceMidiOutput) {
  // Indicators for the Zoom and Jog function subpages
  function _display_indicator(row: number, indicator: string) {
    var data = [0xf0, 0x00, 0x00, 0x66, 0x14, 0x12,
    ]
    if (row === 0) {
      data.push(55)
    } else {
      data.push(111)
    }
    data.push(indicator.charCodeAt(0))
    data.push(0xf7)
    midiOutput.sendMidi(activeDevice, data)
  }

  function _sendDisplayData(row: number, text: string) {
    var lenText = text.length < 56 ? text.length : 56
    var data = [0xf0, 0x00, 0x00, 0x66, 0x14, 0x12]
    var out = data.concat(56 * row) // Row 1 offset

    for (var i = 0; i < lenText; ++i)
      out.push(text.charCodeAt(i))
    while (lenText++ < 56)
      out.push(0x20) // spaces for the rest
    out.push(0xf7)
    midiOutput.sendMidi(activeDevice, out)

  }

  var display = JSON.parse(activeDevice.getState('display'))

  if (new_display.row1 != '') {
    _sendDisplayData(1, new_display.row1)
    display.row1 = new_display.row1
  }
  if (new_display.row2 != '') {
    _sendDisplayData(0, new_display.row2)
    display.row2 = new_display.row2
  }
  if (new_display.indicator1 != '') {
    _display_indicator(1, new_display.indicator1)
    display.indicator1 = new_display.indicator1
  }
  if (new_display.indicator2 != '') {
    _display_indicator(0, new_display.indicator2)
    display.indicator2 = new_display.indicator2
  }
  activeDevice.setState('display', JSON.stringify(display))
}

// var text = '{ "employees" : [' +
// '{ "firstName":"John" , "lastName":"Doe" },' +
// '{ "firstName":"Anna" , "lastName":"Smith" },' +
// '{ "firstName":"Peter" , "lastName":"Jones" } ]}';
// const obj = JSON.parse(text);
// console.log(obj["employees"][2].lastName)