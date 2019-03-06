import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Avatar from '../../../components/avatar';
import DisplayName from '../../../components/display_name';
import StatusContent from '../../../components/status_content';
import MediaGallery from '../../../components/media_gallery';
import AttachmentList from '../../../components/attachment_list';
import { Link } from 'react-router-dom';
import { FormattedDate, FormattedNumber } from 'react-intl';
import Card from './card';
import ImmutablePureComponent from 'react-immutable-pure-component';
import Video from '../../video';
import scheduleIdleTask from '../../ui/util/schedule_idle_task';
import classNames from 'classnames';
import Immutable from 'immutable';
import axios from 'axios';
import {LocMediaGallery } from '../../../features/ui/util/async-components';

import Bundle from '../../../features/ui/components/bundle';

export default class DetailedStatus extends ImmutablePureComponent {

  static contextTypes = {
    router: PropTypes.object,
  };

  static propTypes = {
    status: ImmutablePropTypes.map.isRequired,
    onOpenMedia: PropTypes.func.isRequired,
    onOpenVideo: PropTypes.func.isRequired,
    onToggleHidden: PropTypes.func.isRequired,
    measureHeight: PropTypes.bool,
    onHeightChange: PropTypes.func,
    domain: PropTypes.string.isRequired,
    compact: PropTypes.bool,
  };

  state = {
    height: null,
    locData: {},
    locMedia: ImmutablePropTypes.list
  };

  handleAccountClick = (e) => {
    if (e.button === 0 && !(e.ctrlKey || e.metaKey) && this.context.router) {
      e.preventDefault();
      this.context.router.history.push(`/accounts/${this.props.status.getIn(['account', 'id'])}`);
    }

    e.stopPropagation();
  }

  handleOpenVideo = (media, startTime) => {
    this.props.onOpenVideo(media, startTime);
  }

  handleExpandedToggle = () => {
    this.props.onToggleHidden(this.props.status);
  }

  _measureHeight (heightJustChanged) {
    if (this.props.measureHeight && this.node) {
      scheduleIdleTask(() => this.node && this.setState({ height: Math.ceil(this.node.scrollHeight) + 1 }));

      if (this.props.onHeightChange && heightJustChanged) {
        this.props.onHeightChange();
      }
    }
  }

  setRef = c => {
    this.node = c;
    this._measureHeight();
  }

  renderLoadingMediaGallery () {
    return <div className='media_gallery' style={{ height: '110px' }} />;
  }

  componentDidUpdate (prevProps, prevState) {
    this._measureHeight(prevState.height !== this.state.height);
  }

  componentDidMount () {
    
    var id = this.props.status.get('loc_id');

    var jout = this.props.status.get('loc_json');
    var jgood = jout.split("=>").join("=");

    if (jgood.length > 10) {
      var chk = false;
      try {
        var json = JSON.parse(jgood);
        chk = true;
      } catch (error) {

      }

      if (chk && json.item.image_url.length > 0) {
        var testImages = Immutable.Map(
            {id:'4', 
            type:'image', 
            meta: [{}],
            url: "https:" + json.item.image_url[json.item.image_url.length - 1],
            preview_url: "https:" + json.item.image_url[json.item.image_url.length - 1]
            }
            );

        var mapped = Immutable.List([testImages]);
        this.state.locMedia = mapped;
        this.state.locData = json;
      }
      
      this.setState({ state:this.state });

   }
  }

  handleModalLink = e => {
    e.preventDefault();

    let href;

    if (e.target.nodeName !== 'A') {
      href = e.target.parentNode.href;
    } else {
      href = e.target.href;
    }

    window.open(href, 'mastodon-intent', 'width=445,height=600,resizable=no,menubar=no,status=no,scrollbars=yes');
  }

  render () {
    let locMedia = null;
    const status = (this.props.status && this.props.status.get('reblog')) ? this.props.status.get('reblog') : this.props.status;
    const outerStyle = { boxSizing: 'border-box' };
    const { compact } = this.props;

    if (!status) {
      return null;
    }

    let media           = '';
    let applicationLink = '';
    let reblogLink = '';
    let reblogIcon = 'retweet';
    let favouriteLink = '';
    

    if (this.props.measureHeight) {
      outerStyle.height = `${this.state.height}px`;
    }

    //******** START LOC MEDIA COMPONENT

    if (this.state.locMedia.size > 0) {
      if (this.props.muted || this.state.locMedia.some(item => item.get('type') === 'unknown')) {
        locMedia = (
          <AttachmentList
            compact
            media={this.state.locMedia}
          />
        );
      } else if (status.getIn(['media_attachments', 0, 'type']) === 'video') {
        const video = status.getIn(['media_attachments', 0]);

        locMedia = (
          <Bundle fetchComponent={Video} loading={this.renderLoadingVideoPlayer} >
            {Component => (
              <Component
                preview={video.get('preview_url')}
                src={video.get('url')}
                alt={video.get('description')}
                width={this.props.cachedMediaWidth}
                height={110}
                inline
                sensitive={status.get('sensitive')}
                onOpenVideo={this.handleOpenVideo}
                cacheWidth={this.props.cacheMediaWidth}
              />
            )}
          </Bundle>
        );
      } else {
        console.log(locMedia)
        locMedia = (
          <Bundle fetchComponent={LocMediaGallery} loading={this.renderLoadingMediaGallery}>
            {Component => (
              <Component
                media={this.state.locMedia}
                sensitive={status.get('sensitive')}
                height={110}
                onOpenMedia={this.props.onOpenMedia}
                cacheWidth={this.props.cacheMediaWidth}
                defaultWidth={this.props.cachedMediaWidth}
              />
            )}
          </Bundle>
        );
      }
    } else if (status.get('spoiler_text').length === 0 && status.get('card')) {
      locMedia = (
        <Card
          onOpenMedia={this.props.onOpenMedia}
          card={status.get('card')}
          compact
          cacheWidth={this.props.cacheMediaWidth}
          defaultWidth={this.props.cachedMediaWidth}
        />
      );
    }

    //******** END LOC MEDIA COMPONENT

    if (status.get('media_attachments').size > 0) {
      if (status.get('media_attachments').some(item => item.get('type') === 'unknown')) {
        media = <AttachmentList media={status.get('media_attachments')} />;
      } else if (status.getIn(['media_attachments', 0, 'type']) === 'video') {
        const video = status.getIn(['media_attachments', 0]);

        media = (
          <Video
            preview={video.get('preview_url')}
            src={video.get('url')}
            alt={video.get('description')}
            width={300}
            height={150}
            inline
            onOpenVideo={this.handleOpenVideo}
            sensitive={status.get('sensitive')}
          />
        );
      } else {
        media = (
          <MediaGallery
            standalone
            sensitive={status.get('sensitive')}
            media={status.get('media_attachments')}
            height={300}
            onOpenMedia={this.props.onOpenMedia}
          />
        );
      }
    } else if (status.get('spoiler_text').length === 0) {
      media = <Card onOpenMedia={this.props.onOpenMedia} card={status.get('card', null)} />;
    }

    if (status.get('application')) {
      applicationLink = <span> · <a className='detailed-status__application' href={status.getIn(['application', 'website'])} target='_blank' rel='noopener'>{status.getIn(['application', 'name'])}</a></span>;
    }

    if (status.get('visibility') === 'direct') {
      reblogIcon = 'envelope';
    } else if (status.get('visibility') === 'private') {
      reblogIcon = 'lock';
    }

    if (status.get('visibility') === 'private') {
      reblogLink = <i className={`fa fa-${reblogIcon}`} />;
    } else if (this.context.router) {
      reblogLink = (
        <Link to={`/statuses/${status.get('id')}/reblogs`} className='detailed-status__link'>
          <i className={`fa fa-${reblogIcon}`} />
          <span className='detailed-status__reblogs'>
            <FormattedNumber value={status.get('reblogs_count')} />
          </span>
        </Link>
      );
    } else {
      reblogLink = (
        <a href={`/interact/${status.get('id')}?type=reblog`} className='detailed-status__link' onClick={this.handleModalLink}>
          <i className={`fa fa-${reblogIcon}`} />
          <span className='detailed-status__reblogs'>
            <FormattedNumber value={status.get('reblogs_count')} />
          </span>
        </a>
      );
    }

    if (this.context.router) {
      favouriteLink = (
        <Link to={`/statuses/${status.get('id')}/favourites`} className='detailed-status__link'>
          <i className='fa fa-star' />
          <span className='detailed-status__favorites'>
            <FormattedNumber value={status.get('favourites_count')} />
          </span>
        </Link>
      );
    } else {
      favouriteLink = (
        <a href={`/interact/${status.get('id')}?type=favourite`} className='detailed-status__link' onClick={this.handleModalLink}>
          <i className='fa fa-star' />
          <span className='detailed-status__favorites'>
            <FormattedNumber value={status.get('favourites_count')} />
          </span>
        </a>
      );
    }

    return (
      <div style={outerStyle}>
        <div ref={this.setRef} className={classNames('detailed-status', { compact })}>
          <a href={status.getIn(['account', 'url'])} onClick={this.handleAccountClick} className='detailed-status__display-name'>
            <div className='detailed-status__display-avatar'><Avatar account={status.get('account')} size={48} /></div>
            <DisplayName account={status.get('account')} localDomain={this.props.domain} />
          </a>

          {this.state.locData.item &&
            <div className='loc__block' id={'loc' + status.get('loc_id')} >

            {locMedia}
          
              
              <div className='loc__title'><a target="_blank" href={this.state.locData.item ? this.state.locData.item.id:'null'}>{this.state.locData.item ? this.state.locData.item.title:'no title'}</a></div>
            
              <div className='loc__contributer'>{this.state.locData.item ? this.state.locData.item.contributor_names[0]:'unknown'}</div>

              <div className='loc__date'>{this.state.locData.item ? this.state.locData.item.created_published_date:'unknown'}</div>
              
              <div className = 'loc__details'>
              
              {this.state.locData.item.description &&
              <div className='loc__desc'>{this.state.locData.item ? this.state.locData.item.description.join('\r\n'):''}</div>
              }

              {this.state.locData.item.notes &&
               <div className='loc__notes'>{this.state.locData.item ? this.state.locData.item.notes.join('\r\n'):''}</div>
              }

              </div>
            </div>
            }

          <StatusContent status={status} expanded={!status.get('hidden')} onExpandedToggle={this.handleExpandedToggle} />
          
          

          {media}

          <div className='detailed-status__meta'>
            <a className='detailed-status__datetime' href={status.get('url')} target='_blank' rel='noopener'>
              <FormattedDate value={new Date(status.get('created_at'))} hour12={false} year='numeric' month='short' day='2-digit' hour='2-digit' minute='2-digit' />
            </a>{applicationLink} · {reblogLink} · {favouriteLink}
          </div>
        </div>
      </div>
    );
  }

}
