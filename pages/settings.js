import {     
    Card,         
    Layout, 
    ButtonGroup,
    Button,
    TextField,
    Badge
} from '@shopify/polaris';
import axios from 'axios';
import Modal from "react-responsive-modal";
import FileDownload from 'js-file-download';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {showToastAction} from '../redux/actions';
import pageHeader from '../components/page-header'
import GmailCard from '../components/gmail-auth'
import EmailRegister from '../components/email-register'
import keys, {createPreviewText} from '../helper/template'
import React from 'react'

class Settings extends React.Component {
    mounted = false
    constructor(props){
        super(props)       
        
        this.state = {
            previousSubjectTemplateText: keys.SUBJECT_TEMPLATE_TEXT,
            subjectTemplateText: keys.SUBJECT_TEMPLATE_TEXT,
            previousHeaderTemplateText: keys.HEADER_TEMPLATE_TEXT,
            headerTemplateText: keys.HEADER_TEMPLATE_TEXT,
            previousOrderTemplateText: keys.ORDER_TEMPLATE_TEXT,
            orderTemplateText: keys.ORDER_TEMPLATE_TEXT,
            previousProductTemplateText: keys.PRODUCT_TEMPLATE_TEXT,
            productTemplateText: keys.PRODUCT_TEMPLATE_TEXT,
            previousFooterTemplateText: keys.FOOTER_TEMPLATE_TEXT,
            footerTemplateText: keys.FOOTER_TEMPLATE_TEXT,            
            templateTextLoading: false,
            
            sendMethod: 'manual',  
            sendMethodLoading: false,
            
            selfEmailCopy: true,
            selfEmailCopyLoading: false,
            
            PDFOrderLimit: 100,
            previousPDFOrderLimit: 100,
            PDFOrderLimitLoading: false,
            PDFPreviewLoading: false
        }
    }

    componentDidMount() {
        this.mounted = true      
        axios.get(process.env.APP_URL + '/get-settings')
        .then(res => {            
            if (!this.mounted) return      
            const {
                subjectTemplateText,
                headerTemplateText, 
                orderTemplateText, 
                productTemplateText, 
                footerTemplateText, 

                sendMethod,
                selfEmailCopy,
                
                PDFSettings
            } = res.data
            this.setState({
                previousSubjectTemplateText: (subjectTemplateText) ? subjectTemplateText : keys.SUBJECT_TEMPLATE_TEXT,
                subjectTemplateText: (subjectTemplateText) ? subjectTemplateText : keys.SUBJECT_TEMPLATE_TEXT,
                previousHeaderTemplateText: (headerTemplateText) ? headerTemplateText : keys.HEADER_TEMPLATE_TEXT,
                headerTemplateText: (headerTemplateText) ? headerTemplateText : keys.HEADER_TEMPLATE_TEXT,
                previousOrderTemplateText: (orderTemplateText) ? orderTemplateText : keys.ORDER_TEMPLATE_TEXT,
                orderTemplateText: (orderTemplateText) ? orderTemplateText : keys.ORDER_TEMPLATE_TEXT,
                previousProductTemplateText: (productTemplateText) ? productTemplateText : keys.PRODUCT_TEMPLATE_TEXT,
                productTemplateText: (productTemplateText) ? productTemplateText : keys.PRODUCT_TEMPLATE_TEXT,
                previousFooterTemplateText: (footerTemplateText) ? footerTemplateText : keys.FOOTER_TEMPLATE_TEXT,
                footerTemplateText: (footerTemplateText) ? footerTemplateText : keys.FOOTER_TEMPLATE_TEXT,
                
                sendMethod: sendMethod.method,
                selfEmailCopy,
                
                previousPDFOrderLimit: PDFSettings.PDFOrderLimit,
                PDFOrderLimit: PDFSettings.PDFOrderLimit
            })
        }).catch(() => {               
            if (!this.mounted) return            
            this.props.showToastAction(true, "Couldn't get settings. Please try again later.")
        })  
    }

    setEmailTemplate() {
        this.setState({templateTextLoading: true})
        let {subjectTemplateText, headerTemplateText, orderTemplateText, productTemplateText, footerTemplateText} = this.state
        subjectTemplateText = (subjectTemplateText != keys.SUBJECT_TEMPLATE_TEXT) ? subjectTemplateText : null
        headerTemplateText = (headerTemplateText != keys.HEADER_TEMPLATE_TEXT) ? headerTemplateText : null
        orderTemplateText = (orderTemplateText != keys.ORDER_TEMPLATE_TEXT) ? orderTemplateText : null
        productTemplateText = (productTemplateText != keys.PRODUCT_TEMPLATE_TEXT) ? productTemplateText : null
        footerTemplateText = (footerTemplateText != keys.FOOTER_TEMPLATE_TEXT) ? footerTemplateText : null

        axios.post(process.env.APP_URL + '/email-template', {
            subjectTemplateText,
            headerTemplateText,
            orderTemplateText,
            productTemplateText,
            footerTemplateText
        })
        .then(() => {            
            if (!this.mounted) return            
            this.setState({
                previousSubjectTemplateText: this.state.subjectTemplateText, 
                previousHeaderTemplateText: this.state.headerTemplateText, 
                previousOrderTemplateText: this.state.orderTemplateText, 
                previousProductTemplateText: this.state.productTemplateText,
                previousFooterTemplateText: this.state.footerTemplateText, 
                templateTextLoading: false
            })
            this.props.showToastAction(true, 'Saved settings!')
        }).catch(() => {   
            if (!this.mounted) return            
            this.setState({templateTextLoading: false})
            this.props.showToastAction(true, "Couldn't save. Please try again later.")
        })   
    }

    setSendMethod(sendMethod) {
        this.setState({sendMethodLoading: true})
        axios.post(process.env.APP_URL + '/send-method', {sendMethod})
        .then(() => {            
            if (!this.mounted) return            
            this.setState({sendMethod, sendMethodLoading: false});
            this.props.showToastAction(true, 'Saved settings!')
        }).catch(() => {   
            if (!this.mounted) return            
            this.setState({sendMethodLoading: false})
            this.props.showToastAction(true, "Couldn't save. Please try again later.")
        })   
    }
    
    setSelfEmailCopy(enabled) {
        this.setState({selfEmailCopyLoading: true})
        axios.post(process.env.APP_URL + '/self-email-copy', {enabled})
        .then(() => {            
            if (!this.mounted) return            
            this.setState({selfEmailCopy: enabled, selfEmailCopyLoading: false});
            this.props.showToastAction(true, 'Saved settings!')
        }).catch(() => {   
            if (!this.mounted) return            
            this.setState({selfEmailCopyLoading: false})
            this.props.showToastAction(true, "Couldn't save. Please try again later.")
        })  
    }

    templateIsDefaultMode() {
        return (this.state.subjectTemplateText == keys.SUBJECT_TEMPLATE_TEXT 
            && this.state.headerTemplateText == keys.HEADER_TEMPLATE_TEXT 
            && this.state.orderTemplateText == keys.ORDER_TEMPLATE_TEXT 
            && this.state.productTemplateText == keys.PRODUCT_TEMPLATE_TEXT
            && this.state.footerTemplateText == keys.FOOTER_TEMPLATE_TEXT)
    }

    templateHasNotChanged() {
        return (this.state.previousSubjectTemplateText == this.state.subjectTemplateText
            && this.state.previousHeaderTemplateText == this.state.headerTemplateText 
            && this.state.previousOrderTemplateText == this.state.orderTemplateText 
            && this.state.previousProductTemplateText == this.state.productTemplateText
            && this.state.previousFooterTemplateText == this.state.footerTemplateText)
    }

    renderOrderMethod() {
        return <Card sectioned title="Order Method">
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                    <p style={{lineHeight:'35px'}}>Order email send method (Automatic sends once everyday).</p>
                    <ButtonGroup segmented>
                        <Button 
                            disabled={(this.state.sendMethod == 'manual')}
                            onClick={() => this.setSendMethod('manual')}
                            loading={this.state.sendMethodLoading}
                        >
                            Manual
                        </Button>
                        <Button 
                            disabled={(this.state.sendMethod == 'automatic')}
                            onClick={() => this.setSendMethod('automatic')}
                            loading={this.state.sendMethodLoading}
                        >
                            Automatic
                        </Button>
                    </ButtonGroup>
                    </div>
                </Card>
    }
    
    renderSelfEmailCopy() {
        return <Card sectioned title="Self Receipt">
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                    <p style={{lineHeight:'35px'}}>Send a fulfillment email copy to yourself as well when sending out emails</p>
                    <ButtonGroup segmented>
                        <Button 
                            disabled={(this.state.selfEmailCopy == true)}
                            onClick={() => this.setSelfEmailCopy(true)}
                            loading={this.state.selfEmailCopyLoading}
                        >
                            Send
                        </Button>
                        <Button 
                            disabled={(this.state.selfEmailCopy == false)}
                            onClick={() => this.setSelfEmailCopy(false)}
                            loading={this.state.selfEmailCopyLoading}
                        >
                            Don't Send
                        </Button>
                    </ButtonGroup>
                    </div>
                </Card>
    }
    
    renderPreviewText() {
        const {headerTemplateText, orderTemplateText, productTemplateText, footerTemplateText} = this.state
        return createPreviewText(headerTemplateText, orderTemplateText, productTemplateText, footerTemplateText)
    }
    
    setPDFOrderLimit(PDFOrderLimit) {
        if (isNaN(PDFOrderLimit)) return
        if (PDFOrderLimit < 0 || PDFOrderLimit > 500) return
        this.setState({PDFOrderLimit})
    }

    PDFOrderLimitHasNotChanged () {
        return this.state.previousPDFOrderLimit == this.state.PDFOrderLimit
    }

    getPDFPreview() {
        this.setState({PDFPreviewLoading: true})
        axios.get(process.env.APP_URL + '/get-pdf-preview')
        .then(res => {
            const pdf = new Buffer(res.data, 'base64')
            FileDownload(pdf, 'PDFPreview.pdf');
        }).catch((err) => {   
            if (!this.mounted) return            
            this.setState({PDFPreviewLoading: false})
            console.log('Failed getting PDF preview: ',err)
            this.props.showToastAction(true, "Couldn't get preview. Please try again later.")
        })   
    }

    savePDFOrderLimit() {
        const PDFOrderLimit = this.state.PDFOrderLimit
        this.setState({PDFOrderLimitLoading: true})
        axios.post(process.env.APP_URL + '/set-pdf-order-limit', {
            PDFOrderLimit
        })
        .then(() => {            
            if (!this.mounted) return            
            this.setState({
                PDFOrderLimit, 
                previousPDFOrderLimit: PDFOrderLimit,
                PDFOrderLimitLoading: false
            });
            this.props.showToastAction(true, 'Saved settings!')
        }).catch((err) => {   
            if (!this.mounted) return            
            this.setState({PDFOrderLimitLoading: false})
            console.log('Failed saving PDF order limit: ',err)
            this.props.showToastAction(true, "Couldn't save. Please try again later.")
        })   
    }

    renderPDFSettings() {
        return <Card sectioned title="PDF Settings">
                    <p style={{lineHeight:'35px', display: 'block', width: '100%'}}><b>Send order emails in PDF format</b></p>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                        <div>
                            <p style={{lineHeight:'35px'}}>Convert email body into PDF if there are more than (500 max)</p>
                            <TextField
                                value={this.state.PDFOrderLimit}
                                onChange={PDFOrderLimit => this.setPDFOrderLimit(PDFOrderLimit)}
                            />
                            <p style={{lineHeight:'35px'}}>orders in an email.</p>
                        </div>
                    </div>
                    <div style={{display:'flex', justifyContent:'flex-end'}}>
                        <div style={{marginRight:'20px'}}>
                            <Button onClick={() => this.getPDFPreview()}>
                                Preview
                            </Button>
                        </div>
                        <Button 
                            disabled={this.PDFOrderLimitHasNotChanged()}
                            onClick={() => this.savePDFOrderLimit()}
                            loading={this.state.PDFOrderLimitLoading}
                        >
                            Save
                        </Button>
                    </div>
                </Card>
    }

    render() {
        return (            
            <Layout>
                <Modal 
                    open={this.state.showPreview}
                    onClose={() => this.setState({showPreview: false})}
                    showCloseIcon={true}
                    center
                >
                    <div style={modalContentStyle}>
                        <div style={{width: '90%', margin: '20px', maxHeight:'700px', overflowY: 'auto', whiteSpace: "pre-wrap"}}>
                            {this.renderPreviewText()}
                        </div>                    
                    </div>
                </Modal>
                <Layout.Section>
                    {pageHeader('Settings')}
                    <Card sectioned title="Email Template">
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'30px'}}>
                            <div style={{flex:1, margin: '10px'}}>
                                <p>
                                    This is the template email per product that will be sent to the email you specify. 
                                    A line will be omitted if the information does not exist. <br/>
                                </p>
                                <p style={{lineHeight:'35px'}}>Available subject tag:</p>
                                <Badge status="success">{`{{${keys.SHOP}}}`}</Badge>
                                
                                <p style={{lineHeight:'35px'}}>Available header tag:</p>
                                <Badge status="success">{`{{${keys.SHOP}}}`}</Badge>
                                
                                <p style={{lineHeight:'35px'}}>List of tags you can use:</p>
                                <Badge status="success">{`{{${keys.SHOP}}}`}</Badge>
                                <Badge status="success">{`{{${keys.ORDER_NUMBER}}}`}</Badge>
                                <Badge status="success">{`{{${keys.CREATED_AT}}}`}</Badge>
                                <Badge status="success">{`{{${keys.NOTE}}}`}</Badge>                                
                                <Badge status="success">{`{{${keys.NAME}}}`}</Badge>
                                <Badge status="success">{`{{${keys.EMAIL}}}`}</Badge>
                                <Badge status="success">{`{{${keys.PHONE}}}`}</Badge>
                                <Badge status="success">{`{{${keys.ADDRESS1}}}`}</Badge>
                                <Badge status="success">{`{{${keys.CITY}}}`}</Badge>
                                <Badge status="success">{`{{${keys.ZIP}}}`}</Badge>
                                <Badge status="success">{`{{${keys.PROVINCE}}}`}</Badge>
                                <Badge status="success">{`{{${keys.COUNTRY}}}`}</Badge>
                                <Badge status="success">{`{{${keys.ADDRESS2}}}`}</Badge>
                                <Badge status="success">{`{{${keys.COMPANY}}}`}</Badge>                                                                
                                <Badge status="success">{`{{${keys.PRICE}}}`}</Badge>    
                                
                                <p style={{lineHeight:'35px'}}>List of product tags you can use:</p>
                                <Badge status="success">{`{{${keys.TITLE}}}`}</Badge>
                                <Badge status="success">{`{{${keys.VARIANT_TITLE}}}`}</Badge>
                                <Badge status="success">{`{{${keys.QUANTITY}}}`}</Badge>
                                <Badge status="success">{`{{${keys.SKU}}}`}</Badge>
                                <Badge status="success">{`{{${keys.VENDOR}}}`}</Badge>      
                                <Badge status="success">{`{{${keys.PRODUCT_URL}}}`}</Badge>      
                                <Badge status="success">{`{{${keys.IMAGE_URL}}}`}</Badge>     
                            
                                <p style={{lineHeight:'35px'}}>Available footer tag:</p>
                                <Badge status="success">{`{{${keys.SHOP}}}`}</Badge>
                                <br/>
                                
                                <p style={{lineHeight:'35px'}}>Tip:</p>
                                <p>
                                    For <Badge status="success">{`{{${keys.PRODUCT_URL}}}`}</Badge> and 
                                     <Badge status="success">{`{{${keys.IMAGE_URL}}}`}</Badge> , you can use Html formats such as <br/>
                                    <Badge status="success">{`<a href="{{PRODUCT_URL}}">Product Link</a>`}</Badge> <br/> and <br/>
                                    <Badge status="success">{'<img src="{{IMAGE_URL}}"/>'}</Badge> <br/>
                                    to decorate the email 
                                </p>
                                <br/><br/>
                                
                                <p>
                                    Because an order may have more than one products, the order template will be combined with one or more product templates in the email. 
                                </p>                                                     
                            </div>
                            <div style={{flex:1, margin: '10px'}}>
                                <p style={{lineHeight:'35px'}}>Subject template (Title of the email):</p>
                                <TextField
                                    value={this.state.subjectTemplateText}
                                    onChange={subjectTemplateText => this.setState({subjectTemplateText})}
                                    multiline
                                />
                                <p style={{lineHeight:'35px'}}>Header template:</p>
                                <TextField
                                    value={this.state.headerTemplateText}
                                    onChange={headerTemplateText => this.setState({headerTemplateText})}
                                    multiline
                                />
                                <p style={{lineHeight:'35px'}}>Order template:</p>
                                <TextField
                                    value={this.state.orderTemplateText}
                                    onChange={orderTemplateText => this.setState({orderTemplateText})}
                                    multiline
                                />
                                <p style={{lineHeight:'35px'}}>Product template:</p>
                                <TextField                                    
                                    value={this.state.productTemplateText}
                                    onChange={productTemplateText => this.setState({productTemplateText})}
                                    multiline
                                />
                                <p style={{lineHeight:'35px'}}>Footer template:</p>
                                <TextField
                                    value={this.state.footerTemplateText}
                                    onChange={footerTemplateText => this.setState({footerTemplateText})}
                                    multiline
                                />
                            </div>
                        </div>
                        <div style={{display:'flex', justifyContent:'flex-end'}}>
                        <div style={{marginRight:'20px'}}>
                        <Button 
                            disabled={this.templateIsDefaultMode()}
                            onClick={() => this.setState({
                                subjectTemplateText:keys.SUBJECT_TEMPLATE_TEXT,
                                headerTemplateText:keys.HEADER_TEMPLATE_TEXT,
                                orderTemplateText:keys.ORDER_TEMPLATE_TEXT,
                                productTemplateText: keys.PRODUCT_TEMPLATE_TEXT,
                                footerTemplateText:keys.FOOTER_TEMPLATE_TEXT,
                            })}
                        >
                            Reset to default
                        </Button>                        
                        </div>
                        <div style={{marginRight:'20px'}}>
                        <Button onClick={() => this.setState({showPreview:true})}>
                            Preview
                        </Button>
                        </div>
                        <Button 
                            disabled={this.templateHasNotChanged()}
                            onClick={() => this.setEmailTemplate()}
                            loading={this.state.templateTextLoading}
                        >
                            Save
                        </Button>
                        </div>
                    </Card>                    
                    {this.renderPDFSettings()}
                    {this.renderOrderMethod()}
                    {this.renderSelfEmailCopy()}
                    <EmailRegister/>           
                </Layout.Section>
            </Layout>            
        )
    }
}

const modalContentStyle = {
    padding: '30px',
    display: 'flex',
    width: '700px',
    overflowY: 'auto',
    alignItems: "center",
    justifyContent: "center",    
}

function mapDispatchToProps(dispatch){
    return bindActionCreators(
        {showToastAction},
        dispatch
    );
}

export default connect(null, mapDispatchToProps)(Settings);