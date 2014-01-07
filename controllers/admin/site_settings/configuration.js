/*

    Interface for changing the site configuration
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_ADMINISTRATOR}))
        {
            output({content: ''});
            return;
        }
        
        session.section = 'site_settings';
        session.subsection = 'configuration';

        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/site_settings/configuration', null, null, function(data)
            {
                result = result.concat(data);
                
                displayErrorOrSuccess(session, result, function(newSession, newResult)
                {
                    session = newSession;
                    result = newResult;
                    
                    instance.getConfiguration(result, function(newResult)
                    {
                        result = newResult;
                        
                        editSession(request, session, [], function(data)
                        {
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'site_settings'], result)});
                        });
                    });
                });
            });
        });
    });
}

this.getConfiguration = function(result, output)
{
    if(!fs.existsSync(DOCUMENT_ROOT + '/config.json'))
    {
        result = result.split('^edit_instructions^').join('<div class="alert alert-info">^loc_EDIT_CONFIGURATION^</div>');
    }
    else
    {
        result = result.split('^edit_instructions^').join('');
    }

    result = result.split('^document_root^').join(pb.config.docRoot);
    result = result.split('^site_ip^').join(pb.config.siteIP);
    result = result.split('^site_port^').join(pb.config.sitePort);
    result = result.split('^db_type^').join(pb.config.db.type);
    result = result.split('^db_name^').join(pb.config.db.name);
    result = result.split('^db_servers^').join(pb.config.db.servers.join('<br/>'));
    
    output(result);
}