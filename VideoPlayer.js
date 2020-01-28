import React, { Component } from 'react';
import Video from 'react-native-video';
import {
    TouchableWithoutFeedback,
    PanResponder,
    StyleSheet,
    Animated,
    Easing,
    Image,
    View,
    Text
} from 'react-native';
import _ from 'lodash';

export default class VideoPlayer extends Component {

    static defaultProps = {
        toggleResizeModeOnFullscreen:   true,
        playInBackground:               false,
        playWhenInactive:               false,
        showOnStart:                    true,
        resizeMode:                     'contain',
        paused:                         false,
        repeat:                         false,
        volume:                         1,
        muted:                          false,
        title:                          '',
        rate:                           1,
        isFullscreen:                   false,
    };

    constructor( props ) {
        super( props );

        /**
         * All of our values that are updated by the
         * methods and listeners in this class
         */
        this.state = {
            // Video
            resizeMode: this.props.resizeMode,
            paused: this.props.paused,
            muted: this.props.muted,
            volume: this.props.volume,
            rate: this.props.rate,
            // Controls

            isFullscreen: this.props.isFullScreen || this.props.resizeMode === 'cover' || false,
            showTimeRemaining: true,
            volumeTrackWidth: 0,
            lastScreenPress: 0,
            volumeFillWidth: 0,
            seekerFillWidth: 0,
            showControls: this.props.showOnStart,
            volumePosition: 0,
            seekerPosition: 0,
            volumeOffset: 0,
            seekerOffset: 0,
            seeking: false,
            loading: false,
            currentTime: 0,
            error: false,
            duration: 0,
        };

        /**
         * Any options that can be set at init.
         */
        this.opts = {
            playWhenInactive: this.props.playWhenInactive,
            playInBackground: this.props.playInBackground,
            repeat: this.props.repeat,
            title: this.props.title,
        };

        /**
         * Our app listeners and associated methods
         */
        this.events = {
            onError: this.props.onError || this._onError.bind( this ),
            onEnd: this.props.onEnd || this._onEnd.bind( this ),
            onScreenTouch: this._onScreenTouch.bind( this ),
            onEnterFullscreen: this.props.onEnterFullscreen,
            onExitFullscreen: this.props.onExitFullscreen,
            onLoadStart: this._onLoadStart.bind( this ),
            onProgress: this._onProgress.bind( this ),
            onLoad: this._onLoad.bind( this ),
            onPause: this.props.onPause,
            onPlay: this.props.onPlay,
        };
        /**
         * Player information
         */
        this.player = {
            controlTimeoutDelay: this.props.controlTimeout || 15000,
            volumePanResponder: PanResponder,
            seekPanResponder: PanResponder,
            controlTimeout: null,
            volumeWidth: 150,
            iconOffset: 0,
            seekerWidth: 0,
            ref: Video,
        };

        /**
         * Various animations
         */
        const initialValue = this.props.showOnStart ? 1 : 0;

        this.animations = {
            bottomControl: {
                marginBottom: new Animated.Value( 0 ),
                opacity: new Animated.Value( initialValue ),
            },
            topControl: {
                marginTop: new Animated.Value( 0 ),
                opacity: new Animated.Value( initialValue ),
            },
            video: {
                opacity: new Animated.Value( 1 ),
            },
            loader: {
                rotate: new Animated.Value( 0 ),
                MAX_VALUE: 360,
            }
        };

        /**
         * Various styles that be added...
         */
        this.styles = {
            videoStyle: this.props.videoStyle || {},
            containerStyle: this.props.style || {}
        };
    }



    /**
    | -------------------------------------------------------
    | Events
    | -------------------------------------------------------
    |
    | These are the events that the <Video> component uses
    | and can be overridden by assigning it as a prop.
    | It is suggested that you override onEnd.
    |
    */

    /**
     * When load starts we display a loading icon
     * and show the controls.
     */
    _onLoadStart() {
        let state = this.state;
        state.loading = true;
        this.loadAnimation()
        this.setState( state );

        if ( typeof this.props.onLoadStart === 'function' ) {
            this.props.onLoadStart(...arguments);
        }
    }

      /**
     * Loop animation to spin loader icon. If not loading then stop loop.
     */
    loadAnimation() {
        if ( this.state.loading ) {
            Animated.sequence([
                Animated.timing(
                    this.animations.loader.rotate,
                    {
                        toValue: this.animations.loader.MAX_VALUE,
                        duration: 1500,
                        easing: Easing.linear,
                    }
                ),
                Animated.timing(
                    this.animations.loader.rotate,
                    {
                        toValue: 0,
                        duration: 0,
                        easing: Easing.linear,
                    }
                ),
            ]).start( this.loadAnimation.bind( this ) );
        }
    }

    /**
     * When load is finished we hide the load icon
     * and hide the controls. We also set the
     * video duration.
     *
     * @param {object} data The video meta data
     */
    _onLoad( data = {} ) {
        let state = this.state;

        state.duration = data.duration;
        state.loading = false;
        this.setState( state );

        if ( typeof this.props.onLoad === 'function' ) {
            this.props.onLoad(...arguments);
        }
    }

    /**
     * For onprogress we fire listeners that
     * update our seekbar and timer.
     *
     * @param {object} data The video meta data
     */
    _onProgress( data = {} ) {
        let state = this.state;
        state.currentTime = data.currentTime;

        if ( typeof this.props.onProgress === 'function' ) {
            this.props.onProgress(...arguments);
        }

        this.setState( state );
    }

    /**
     * It is suggested that you override this
     * command so your app knows what to do.
     * Either close the video or go to a
     * new page.
     */
    _onEnd() {}

    /**
     * Set the error state to true which then
     * changes our renderError function
     *
     * @param {object} err  Err obj returned from <Video> component
     */
    _onError( err ) {
        let state = this.state;
        state.error = true;
        state.loading = false;

        this.setState( state );
    }

    /**
     * This is a single and double tap listener
     * when the user taps the screen anywhere.
     * One tap toggles controls, two toggles
     * fullscreen mode.
     */
    _onScreenTouch() {
        let state = this.state;
        const time = new Date().getTime();
        const delta =  time - state.lastScreenPress;

        if ( delta < 300 ) {
            // this.methods.toggleFullscreen();
        }

        state.lastScreenPress = time;

        this.setState( state );
    }





    /**
    | -------------------------------------------------------
    | React Component functions
    | -------------------------------------------------------
    |
    | Here we're initializing our listeners and getting
    | the component ready using the built-in React
    | Component methods
    |
    */

    /**
     * To allow basic playback management from the outside
     * we have to handle possible props changes to state changes
     */
    componentWillReceiveProps(nextProps) {
        if (this.state.paused !== nextProps.paused ) {
            this.setState({
                paused: nextProps.paused
            })
        }

        if(this.styles.videoStyle !== nextProps.videoStyle){
            this.styles.videoStyle = nextProps.videoStyle;
        }

        if(this.styles.containerStyle !== nextProps.style){
            this.styles.containerStyle = nextProps.style;
        }
    }

    /**
     * Upon mounting, calculate the position of the volume
     * bar based on the volume property supplied to it.
     */
    componentDidMount() {
        let state = this.state;
        this.mounted = true;
        this.setState( state );
    }

    /**
     * When the component is about to unmount kill the
     * timeout less it fire in the prev/next scene
     */
    componentWillUnmount() {
        this.mounted = false;
    }


    /**
     * Show loading icon
     */
    renderLoader() {
        if ( this.state.loading ) {
            return (
                <View style={ styles.loader.container }>
                    <Animated.Image source={ require( './assets/img/loader-icon.png' ) } style={[
                        styles.loader.icon,
                        { transform: [
                            { rotate: this.animations.loader.rotate.interpolate({
                                inputRange: [ 0, 360 ],
                                outputRange: [ '0deg', '360deg' ]
                            })}
                        ]}
                    ]} />
                </View>
            );
        }
        return null;
    }

    renderError() {
        if ( this.state.error ) {
            return (
                <View style={ styles.error.container }>
                    <Image source={ require( './assets/img/error-icon.png' ) } style={ styles.error.icon } />
                    <Text style={ styles.error.text }>
                        Video unavailable
                    </Text>
                </View>
            );
        }
        return null;
    }

    /**
     * Provide all of our options and render the whole component.
     */
    render() {
        return (
            <TouchableWithoutFeedback
                onPress={ this.events.onScreenTouch }
                style={[ styles.player.container, this.styles.containerStyle ]}
            >
                <View style={[ styles.player.container, this.styles.containerStyle ]}>
                    <Video
                        { ...this.props }
                        ref={ videoPlayer => this.player.ref = videoPlayer }

                        resizeMode={ this.state.resizeMode }
                        volume={ this.state.volume }
                        paused={ this.state.paused }
                        muted={ this.state.muted }
                        rate={ this.state.rate }

                        onLoadStart={ this.events.onLoadStart }
                        onProgress={ this.events.onProgress }
                        onError={ this.events.onError }
                        onLoad={ this.events.onLoad }
                        onEnd={ this.events.onEnd }

                        style={[ styles.player.video, this.styles.videoStyle ]}

                        source={ this.props.source }
                    />
                    { this.renderError() }
                    { this.renderLoader() }
                </View>
            </TouchableWithoutFeedback>
        );
    }
}

/**
 * This object houses our styles. There's player
 * specific styles and control specific ones.
 * And then there's volume/seeker styles.
 */
const styles = {
    player: StyleSheet.create({
        container: {
            backgroundColor: '#000',
            flex: 1,
            alignSelf: 'stretch',
            justifyContent: 'space-between',
        },
        video: {
            overflow: 'hidden',
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        },
    }),
    error: StyleSheet.create({
        container: {
            backgroundColor: 'rgba( 0, 0, 0, 0.5 )',
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            justifyContent: 'center',
            alignItems: 'center',
        },
        icon: {
            marginBottom: 16,
        },
        text: {
            backgroundColor: 'transparent',
            color: '#f27474'
        },
    }),
    loader: StyleSheet.create({
        container: {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            alignItems: 'center',
            justifyContent: 'center',
        },
    }),
    controls: StyleSheet.create({
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: null,
            width: null,
        },
        column: {
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: null,
            width: null,
        },
        vignette: {
            resizeMode: 'stretch'
        },
        control: {
            padding: 16,
        },
        text: {
            backgroundColor: 'transparent',
            color: '#FFF',
            fontSize: 14,
            textAlign: 'center',
        },
        pullRight: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        top: {
            flex: 1,
            alignItems: 'stretch',
            justifyContent: 'flex-start',
        },
        bottom: {
            alignItems: 'stretch',
            flex: 2,
            justifyContent: 'flex-end',
        },
        topControlGroup: {
            alignSelf: 'stretch',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'row',
            width: null,
            margin: 12,
            marginBottom: 18,
        },
        bottomControlGroup: {
            alignSelf: 'stretch',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginLeft: 12,
            marginRight: 12,
            marginBottom: 0,
        },
        volume: {
            flexDirection: 'row',
        },
        fullscreen: {
            flexDirection: 'row',
        },
        playPause: {
            position: 'relative',
            width: 80,
            zIndex: 0
        },
        title: {
            alignItems: 'center',
            flex: 0.6,
            flexDirection: 'column',
            padding: 0,
        },
        titleText: {
            textAlign: 'center',
        },
        timer: {
            width: 80,
        },
        timerText: {
            backgroundColor: 'transparent',
            color: '#FFF',
            fontSize: 11,
            textAlign: 'right',
        },
    }),
    volume: StyleSheet.create({
        container: {
            alignItems: 'center',
            justifyContent: 'flex-start',
            flexDirection: 'row',
            height: 1,
            marginLeft: 20,
            marginRight: 20,
            width: 150,
        },
        track: {
            backgroundColor: '#333',
            height: 1,
            marginLeft: 7,
        },
        fill: {
            backgroundColor: '#FFF',
            height: 1,
        },
        handle: {
            position: 'absolute',
            marginTop: -24,
            marginLeft: -24,
            padding: 16,
        },
        icon: {
            marginLeft:7
        }
    }),
    seekbar: StyleSheet.create({
        container: {
            alignSelf: 'stretch',
            height: 28,
            marginLeft: 20,
            marginRight: 20
        },
        track: {
            backgroundColor: '#333',
            height: 1,
            position: 'relative',
            top: 14,
            width: '100%'
        },
        fill: {
            backgroundColor: '#FFF',
            height: 1,
            width: '100%'
        },
        handle: {
            position: 'absolute',
            marginLeft: -7,
            height: 28,
            width: 28,
        },
        circle: {
            borderRadius: 12,
            position: 'relative',
            top: 8, left: 8,
            height: 12,
            width: 12,
        },
    })
};
